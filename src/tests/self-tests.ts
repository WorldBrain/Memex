import StorageManager from '@worldbrain/storex'
import { BackgroundModules } from 'src/background-script/setup'
import { ServerStorage } from 'src/storage/types'
import { WorldbrainAuthService } from '@worldbrain/memex-common/lib/authentication/worldbrain'
import { normalizeUrl } from '@worldbrain/memex-url-utils/lib/normalize/utils'
import { AnnotationPrivacyLevels } from 'src/annotations/types'
import { EXTENSION_SETTINGS_NAME } from '@worldbrain/memex-common/lib/extension-settings/constants'

export function createSelfTests(options: {
    backgroundModules: BackgroundModules
    storageManager: StorageManager
    persistentStorageManager: StorageManager
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

        const serverStorage = await options.getServerStorage()
        await serverStorage.storageModules.userManagement.ensureUser(
            {
                displayName: 'Test user',
            },
            { type: 'user-reference', id: user.id },
        )

        return user
    }

    const tests = {
        cloudSend: async (testOptions?: { unshareAnnotation?: boolean }) => {
            await clearDb(options.storageManager)
            await clearDb(options.persistentStorageManager)
            console.log('Cleared local databases')

            const user = await ensureTestUser()
            console.log('Self test user:', user.id)

            const serverStorage = await options.getServerStorage()
            console.log('server storage:', serverStorage)
            await clearDb(serverStorage.storageManager, {
                getWhere: async (collectionName) => {
                    if (!collectionName.startsWith('personal')) {
                        return null
                    }
                    if (
                        collectionName === 'personalBlockStats' ||
                        collectionName === 'personalCloudError'
                    ) {
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
                    return where
                },
            })
            console.log('Cleared Firestore personal cloud collections')

            await personalCloud.options.settingStore.set('deviceId', null)
            await personalCloud.loadDeviceId()
            console.log('Generated device ID:', personalCloud.deviceId!)

            if (process.env.TEST_READWISE_API_KEY?.length > 0) {
                await backgroundModules.settings.set({
                    [EXTENSION_SETTINGS_NAME.ReadwiseAPIKey]:
                        process.env.TEST_READWISE_API_KEY,
                })
                console.log('Set test Readwise API Key')
            }

            const testPageUrl = 'https://www.getmemex.com/'
            const normalizedTestPageUrl = normalizeUrl(testPageUrl, {})
            await backgroundModules.tags.addTagToPage({
                url: testPageUrl,
                tag: 'test-tag',
            })
            console.log(`Added tag 'test-tag' to '${testPageUrl}'`)
            await backgroundModules.bookmarks.addBookmark({
                url: normalizedTestPageUrl,
                fullUrl: testPageUrl,
                skipIndexing: true,
            })
            console.log(`Bookmarked '${testPageUrl}'`)
            const publicAnnotationUrl = await backgroundModules.directLinking.createAnnotation(
                {
                    tab: {} as any,
                },
                {
                    pageUrl: normalizedTestPageUrl,
                    comment: 'Hi, this is a test comment',
                    createdWhen: new Date('2021-07-20'),
                },
                { skipPageIndexing: true },
            )
            console.log(`Added private note to '${testPageUrl}'`)
            await backgroundModules.directLinking.createAnnotation(
                {
                    tab: {} as any,
                },
                {
                    pageUrl: normalizedTestPageUrl,
                    comment: `Yet another test comment! This one's protected`,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    createdWhen: new Date('2021-07-21'),
                },
                { skipPageIndexing: true },
            )
            console.log(`Added protected note to '${testPageUrl}'`)
            await backgroundModules.directLinking.createAnnotation(
                {
                    tab: {} as any,
                },
                {
                    pageUrl: normalizedTestPageUrl,
                    comment: `*memex-debug*: upload error`,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    createdWhen: new Date('2021-07-21'),
                },
                { skipPageIndexing: true },
            )
            console.log(
                `Added upload error generating note to '${testPageUrl}'`,
            )
            await backgroundModules.directLinking.createAnnotation(
                {
                    tab: {} as any,
                },
                {
                    pageUrl: normalizedTestPageUrl,
                    comment: `*memex-debug*: download error`,
                    privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    createdWhen: new Date('2021-07-21'),
                },
                { skipPageIndexing: true },
            )
            console.log(
                `Added download error generating note to '${testPageUrl}'`,
            )
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

            const {
                remoteListId: remoteListId1,
            } = await backgroundModules.contentSharing.shareList({
                listId: testListId1,
            })
            console.log('Shared test list #1, remote ID:', remoteListId1)
            const {
                remoteListId: remoteListId2,
            } = await backgroundModules.contentSharing.shareList({
                listId: testListId2,
            })
            console.log('Shared test list #2, remote ID:', remoteListId2)

            await serverStorage.storageModules.contentSharing.ensurePageInfo({
                creatorReference: { type: 'user-reference', id: user.id },
                pageInfo: {
                    normalizedUrl: normalizedTestPageUrl,
                    originalUrl: testPageUrl,
                },
            })
            await backgroundModules.contentSharing.shareAnnotation({
                annotationUrl: publicAnnotationUrl,
            })
            await backgroundModules.contentSharing.shareAnnotationsToLists({
                annotationUrls: [publicAnnotationUrl],
            })
            await backgroundModules.directLinking.editAnnotation(
                null,
                publicAnnotationUrl,
                'Edited comment',
            )
            console.log('Shared and edited annotation')

            if (testOptions?.unshareAnnotation) {
                const sharedAnnotationId = (
                    await backgroundModules.contentSharing.storage.getRemoteAnnotationIds(
                        {
                            localIds: [publicAnnotationUrl],
                        },
                    )
                )[publicAnnotationUrl]
                await backgroundModules.contentSharing.unshareAnnotation({
                    annotationUrl: publicAnnotationUrl,
                    queueInteraction: 'skip-queue',
                })
                console.log('Unshared annotation', sharedAnnotationId)
            }

            await serverStorage.storageModules.contentSharing.createAnnotations(
                {
                    annotationsByPage: {
                        [normalizedTestPageUrl]: [
                            {
                                createdWhen: Date.now(),
                                localId: 'blub',
                                comment: 'Yes, totally!',
                            },
                        ],
                    },
                    creator: { type: 'user-reference', id: user.id },
                    listReferences: [],
                },
            )

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
