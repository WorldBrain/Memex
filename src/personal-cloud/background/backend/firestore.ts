import debounce from 'lodash/debounce'
import createResolvable from '@josephg/resolvable'
import { firestore } from 'firebase'
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
            getUserChangesReference: () => Promise<firestore.CollectionReference | null>
            settingStore: SettingStore<PersonalCloudSettings>
        },
    ) {}

    async pushUpdates(updates: PersonalCloudUpdatePushBatch): Promise<void> {
        await this.options.personalCloudService.uploadClientUpdates({ updates })
    }

    async *streamUpdates(): AsyncIterableIterator<PersonalCloudUpdateBatch> {
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
            const changesReference = await this.options.getUserChangesReference()
            if (!changesReference) {
                cleanup = async () => {}
                return
            }

            const unsubscribe = changesReference
                .where('createdWhen', '>', lastSeen ?? 0)
                .onSnapshot((snapshot) => {
                    for (const change of snapshot.docChanges()) {
                        if (change.type === 'added') {
                            resolveAdded()
                        }
                    }
                })
            cleanup = async () => {
                unsubscribe()
                cleanedUp = true
            }
        }
        await setup()

        const userChanges = this.options.userChanges()
        while (true) {
            const event = await Promise.race([
                addedResolvable.then(() => 'added' as 'added'),
                userChanges.next().then(() => 'user-change' as 'user-change'),
            ])
            if (event === 'user-change') {
                await cleanup()
                await setup()
            } else if (event === 'added') {
                while (true) {
                    const result = await this.options.personalCloudService.downloadClientUpdates(
                        {
                            startTime: lastSeen,
                            clientSchemaVersion: this.options.getCurrentSchemaVersion(),
                        },
                    )
                    yield result.batch
                    lastSeen = result.lastSeen
                    await this.options.settingStore.set('lastSeen', lastSeen)
                }
            }
        }
    }
}
