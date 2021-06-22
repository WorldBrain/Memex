import debounce from 'lodash/debounce'
import createResolvable from '@josephg/resolvable'
import firebase from 'firebase/app'
import {
    PersonalCloudBackend,
    PersonalCloudService,
    PersonalCloudUpdatePushBatch,
    PersonalCloudUpdateBatch,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { SettingStore } from 'src/util/settings'
import { PersonalCloudSettings } from '../types'

export default class FirestorePersonalCloudBackend
    implements PersonalCloudBackend {
    constructor(
        public options: {
            getCurrentSchemaVersion: () => Date
            personalCloudService: PersonalCloudService
            userChanges: () => AsyncIterableIterator<void>
            getUserChangesReference: () => Promise<firebase.firestore.CollectionReference | null>
            settingStore: SettingStore<PersonalCloudSettings>
        },
    ) {}

    async pushUpdates(updates: PersonalCloudUpdatePushBatch): Promise<void> {
        await this.options.personalCloudService.uploadClientUpdates({ updates })
    }

    async *streamUpdates(): AsyncIterableIterator<PersonalCloudUpdateBatch> {
        const {
            settingStore,
            personalCloudService,
            getCurrentSchemaVersion,
            getUserChangesReference,
        } = this.options

        let addedResolvable = createResolvable()
        let lastSeen = 0
        let cleanup = async () => {}

        const setup = async () => {
            let cleanedUp = false
            const resolveAdded = debounce(
                () => {
                    if (!cleanedUp) {
                        const added = addedResolvable
                        addedResolvable = createResolvable()
                        added.resolve()
                    }
                },
                1000,
                { trailing: true },
            )

            addedResolvable = createResolvable()
            lastSeen = (await this.options.settingStore.get('lastSeen')) ?? 0
            const changesReference = await getUserChangesReference()
            if (!changesReference) {
                cleanup = async () => {}
                return
            }

            // console.log('listen to changes from', lastSeen)
            const unsubscribe = changesReference
                .where(
                    'createdWhen',
                    '>',
                    firebase.firestore.Timestamp.fromMillis(lastSeen),
                )
                .onSnapshot((snapshot) => {
                    // console.log('got snapshot')
                    for (const change of snapshot.docChanges()) {
                        // console.log('change', change)
                        if (change.type === 'added') {
                            resolveAdded()
                        }
                    }
                })
            cleanup = async () => {
                cleanedUp = true
                unsubscribe()
            }
        }
        await setup()

        const downloadUpdates = async function* () {
            if (!(await getUserChangesReference())) {
                return
            }

            while (true) {
                // console.log('download update batch from', lastSeen)
                const result = await personalCloudService.downloadClientUpdates(
                    {
                        startTime: lastSeen,
                        clientSchemaVersion: getCurrentSchemaVersion(),
                    },
                )
                // console.log('result', result)
                yield result.batch
                lastSeen = result.lastSeen
                await settingStore.set('lastSeen', lastSeen)
                if (!result.maybeHasMore) {
                    break
                }
            }
        }
        yield* downloadUpdates()

        const userChanges = this.options.userChanges()
        while (true) {
            // console.log('event iter start')

            const event = await Promise.race([
                addedResolvable.then(() => 'added' as 'added'),
                userChanges.next().then(() => 'user-change' as 'user-change'),
            ])
            if (event === 'user-change') {
                // console.log('user change')
                await cleanup()
                await setup()
                yield* downloadUpdates()
            } else if (event === 'added') {
                // console.log('added')
                yield* downloadUpdates()
            }

            // console.log('event iter end')
        }
    }
}
