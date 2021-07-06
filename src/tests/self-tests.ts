import StorageManager from '@worldbrain/storex'
import { BackgroundModules } from 'src/background-script/setup'
import { ServerStorage } from 'src/storage/types'
import { WorldbrainAuthService } from '@worldbrain/memex-common/lib/authentication/worldbrain'
import FirestorePersonalCloudBackend from 'src/personal-cloud/background/backend/firestore'
import { normalizeUrl } from '@worldbrain/memex-url-utils/lib/normalize/utils'
import { AnnotationPrivacyLevels } from 'src/annotations/types'

export function createSelfTests(options: {
    backgroundModules: BackgroundModules
    storageManager: StorageManager
    getServerStorage: () => Promise<ServerStorage>
}) {
    const { backgroundModules } = options
    const { personalCloud } = backgroundModules

    const ensureTestUser = async () => {
        const authService = backgroundModules.auth
            .authService as WorldbrainAuthService
        if (!(await authService.getCurrentUser())) {
            try {
                await authService.firebase
                    .auth()
                    .signInWithEmailAndPassword('test@test.com', 'testing')
            } catch (e) {
                await authService.firebase
                    .auth()
                    .createUserWithEmailAndPassword('test@test.com', 'testing')
            }
        }
        const user = await authService.getCurrentUser()
        if (!user) {
            throw new Error(`Could not authenticate user`)
        }
        return user
    }

    const tests = {
        cloudSend: async () => {
            await clearDb(options.storageManager)
            console.log('Cleared local database')

            const user = await ensureTestUser()
            console.log('Self test user:', user.id)

            const serverStorage = await options.getServerStorage()
            console.log('server storage:', serverStorage)
            await clearDb(serverStorage.storageManager, {
                getWhere: async (collectionName) => {
                    if (!collectionName.startsWith('personal')) {
                        return null
                    }
                    const objects = (await serverStorage.storageManager
                        .collection(collectionName)
                        .findObjects({
                            user: user.id,
                        })) as any[]
                    if (!objects.length) {
                        return null
                    }
                    const where = {
                        user: user.id,
                        id: { $in: objects.map((object) => object.id) },
                    }
                    if (collectionName === 'personalDeviceInfo') {
                        console.log(collectionName, where)
                    }
                    return where
                },
            })
            console.log('Cleared Firestore personal cloud collections')

            await personalCloud.options.settingStore.set('deviceId', null)
            await personalCloud.loadDeviceId()
            console.log('Generated device ID:', personalCloud.deviceId!)
            // // const cloudBackend = personalCloud.options.backend as FirestorePersonalCloudBackend
            const testPageUrl = 'https://www.getmemex.com/'
            const normalizedTestPageUrl = normalizeUrl(testPageUrl, {})
            await backgroundModules.tags.addTagToPage({
                url: testPageUrl,
                tag: 'test-tag',
            })
            console.log(`Added tag 'test-tag' to 'https://www.getmemex.com'`)
            await backgroundModules.bookmarks.addBookmark({
                url: normalizedTestPageUrl,
                fullUrl: testPageUrl,
                skipIndexing: true,
            })
            console.log(`Bookmarked 'https://www.getmemex.com'`)
            await backgroundModules.directLinking.createAnnotation(
                {
                    tab: {} as any,
                },
                {
                    pageUrl: normalizedTestPageUrl,
                    comment: 'Hi, this is a test comment',
                },
                { skipPageIndexing: true },
            )
            console.log(`Added private note to 'https://www.getmemex.com'`)
            await backgroundModules.directLinking.createAnnotation(
                {
                    tab: {} as any,
                },
                {
                    pageUrl: normalizedTestPageUrl,
                    comment: `Yet another test comment! This one's protected`,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                },
                { skipPageIndexing: true },
            )
            console.log(`Added protected note to 'https://www.getmemex.com'`)
            const testListId1 = await backgroundModules.customLists.createCustomList(
                {
                    name: 'My test list #1',
                },
            )
            const testListId2 = await backgroundModules.customLists.createCustomList(
                {
                    name: 'My test list #2',
                },
            )
            await backgroundModules.customLists.insertPageToList({
                id: testListId1,
                url: normalizedTestPageUrl,
                skipPageIndexing: true,
            })
            await backgroundModules.customLists.insertPageToList({
                id: testListId2,
                url: normalizedTestPageUrl,
                skipPageIndexing: true,
            })
            console.log(`Added 'https://www.getmemex.com' to 2 lists`)
            await backgroundModules.copyPaster.createTemplate({
                title: 'Test template',
                code: 'Soem test code {{{PageTitle}}}',
                isFavourite: false,
            })
            console.log(`Added test copy-paster template`)

            await personalCloud.waitForSync()
            console.log('Waited for sync to cloud from this device')

            console.log('End of self test')
        },
        cloudReceive: async () => {
            await clearDb(options.storageManager)
            console.log('Cleared local database')

            await ensureTestUser()
            await personalCloud.options.settingStore.set('deviceId', null)
            await personalCloud.loadDeviceId()
        },
    }
    return tests
}

async function clearDb(
    storageManager: StorageManager,
    options?: {
        getWhere?: (
            collectionName?: string,
        ) => Promise<{ [key: string]: any } | null>
    },
) {
    const getWhere = options?.getWhere ?? (async () => ({}))

    await Promise.all(
        Object.keys(storageManager.registry.collections).map(
            async (collectionName) => {
                const where = await getWhere(collectionName)
                if (!where) {
                    return
                }

                try {
                    await storageManager.backend.operation(
                        'deleteObjects',
                        collectionName,
                        where,
                    )
                } catch (e) {
                    console.error(
                        `Failed to clear personal cloud collection: ${collectionName}`,
                    )
                    console.error(e)
                    throw new Error(
                        `Failed to clear personal cloud collection: ${collectionName}`,
                    )
                }
            },
        ),
    )
}
