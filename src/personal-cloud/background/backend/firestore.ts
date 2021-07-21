import debounce from 'lodash/debounce'
import createResolvable from '@josephg/resolvable'
import firebase from 'firebase/app'
import {
    PersonalCloudBackend,
    PersonalCloudService,
    PersonalCloudUpdatePushBatch,
    PersonalCloudUpdateBatch,
    UploadClientUpdatesResult,
    MediaChangeInfo,
    UploadToMediaParams,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { SettingStore } from 'src/util/settings'
import { PersonalCloudSettings } from '../types'
import { ServerStorage } from 'src/storage/types'
import { writeMediaChange } from '@worldbrain/memex-common/lib/personal-cloud/backend/utils'

export default class FirestorePersonalCloudBackend
    implements PersonalCloudBackend {
    constructor(
        public options: {
            getServerStorage: () => Promise<ServerStorage>
            getCurrentSchemaVersion: () => Date
            personalCloudService: PersonalCloudService
            userChanges: () => AsyncIterableIterator<void>
            getUserChangesReference: () => Promise<firebase.firestore.CollectionReference | null>
            settingStore: SettingStore<PersonalCloudSettings>
        },
    ) {}

    async pushUpdates(
        updates: PersonalCloudUpdatePushBatch,
    ): Promise<UploadClientUpdatesResult> {
        return this.options.personalCloudService.uploadClientUpdates({
            updates,
        })
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

    async uploadToMedia(params: UploadToMediaParams): Promise<void> {
        const serverStorage = await this.options.getServerStorage()
        const userId = firebase.auth().currentUser?.uid
        if (!userId) {
            throw new Error(
                `User tried to upload to storage without being logged in`,
            )
        }

        let { mediaPath } = params
        if (mediaPath.startsWith('/')) {
            mediaPath = mediaPath.slice(1)
        }
        const ref = firebase.storage().ref(mediaPath)
        if (typeof params.mediaObject === 'string') {
            await ref.putString(params.mediaObject, 'raw', {
                contentType: params.contentType ?? 'text/plain',
            })
        } else {
            await ref.put(params.mediaObject)
        }
        await writeMediaChange({
            ...params,
            storageManager: serverStorage.storageManager,
            userId,
        })
    }

    downloadFromMedia: PersonalCloudBackend['downloadFromMedia'] = async (
        params,
    ) => {
        let { path } = params
        if (path.startsWith('/')) {
            path = path.slice(1)
        }
        const ref = firebase.storage().ref(path)
        const downloadUrl = await ref.getDownloadURL()
        if (!downloadUrl) {
            return null
        }

        const response = await fetch(downloadUrl)
        const blob = await response.blob()
        return blob
    }
}
