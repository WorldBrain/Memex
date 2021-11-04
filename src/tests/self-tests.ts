import StorageManager from '@worldbrain/storex'
import { BackgroundModules } from 'src/background-script/setup'
import { ServerStorage } from 'src/storage/types'
import { WorldbrainAuthService } from '@worldbrain/memex-common/lib/authentication/worldbrain'
import { normalizeUrl } from '@worldbrain/memex-url-utils/lib/normalize/utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { SYNCED_SETTING_KEYS } from '@worldbrain/memex-common/lib/synced-settings/constants'

type CloudSendTest =
    | 'tag'
    | 'bookmark'
    | 'list'
    | 'copy-paste'
    | 'note'
    | 'note.private'
    | 'note.protected'
    | 'errors'
    | 'errors.upload'
    | 'errors.download'
    | 'share'
    | 'share.list'
    | 'share.note'
    | 'share.note.edit'
    | 'share.note.remove'
    | 'share.incoming.note'
    | 'lots-of-data'
    | 'pdf'
    | 'pdf.online'
    | 'pdf.online.share'

function matchTest<Test extends string>(
    test: Test,
    testOptions?: {
        only?: Test[]
        skip?: Test[]
    },
) {
    const parts = test.split('.')
    const paths = [...parts.entries()].map(([index]) =>
        parts.slice(0, index + 1).join('.'),
    )
    let foundInOnly = false
    for (const path of paths) {
        if (testOptions?.skip?.includes?.(path as Test)) {
            return false
        }

        foundInOnly = foundInOnly || testOptions?.only?.includes?.(path as Test)
    }
    if (testOptions?.only && !foundInOnly) {
        return false
    }

    return true
}

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
        cloudSend: async (testOptions?: {
            only?: CloudSendTest[]
            skip?: CloudSendTest[]
        }) => {
            const shouldTest = (test: CloudSendTest) => {
                return matchTest(test, testOptions)
            }

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
                        collectionName === 'personalCloudError' ||
                        collectionName === 'personalReadwiseAction'
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
            await personalCloud.startSync()
            console.log('Generated device ID:', personalCloud.deviceId!)

            if (process.env.TEST_READWISE_API_KEY?.length > 0) {
                await backgroundModules.syncSettings.set({
                    [SYNCED_SETTING_KEYS.ReadwiseAPIKey]:
                        process.env.TEST_READWISE_API_KEY,
                })
                console.log('Set test Readwise API Key')
            }

            const testPageUrl = 'https://www.getmemex.com/'
            const normalizedTestPageUrl = normalizeUrl(testPageUrl, {})
            if (shouldTest('tag')) {
                await backgroundModules.tags.addTagToPage({
                    url: testPageUrl,
                    tag: 'test-tag',
                })
                console.log(`Added tag 'test-tag' to '${testPageUrl}'`)
            }
            if (shouldTest('bookmark')) {
                await backgroundModules.bookmarks.addBookmark({
                    url: normalizedTestPageUrl,
                    fullUrl: testPageUrl,
                    skipIndexing: true,
                })
                console.log(`Bookmarked '${testPageUrl}'`)
            }
            let publicAnnotationUrl: string
            if (shouldTest('note.private') || shouldTest('share.note')) {
                publicAnnotationUrl = await backgroundModules.directLinking.createAnnotation(
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
            }
            if (shouldTest('note.protected')) {
                const publicAnnotation2 = await backgroundModules.directLinking.createAnnotation(
                    {
                        tab: {} as any,
                    },
                    {
                        pageUrl: normalizedTestPageUrl,
                        comment: `Yet another test comment! This one's protected`,
                        createdWhen: new Date('2021-07-21'),
                    },
                    { skipPageIndexing: true },
                )
                await backgroundModules.contentSharing.setAnnotationPrivacyLevel(
                    {
                        annotation: publicAnnotation2,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    },
                )
                console.log(`Added protected note to '${testPageUrl}'`)
            }
            if (shouldTest('errors.upload')) {
                const publicAnnotation3 = await backgroundModules.directLinking.createAnnotation(
                    {
                        tab: {} as any,
                    },
                    {
                        pageUrl: normalizedTestPageUrl,
                        comment: `*memex-debug*: upload error`,
                        createdWhen: new Date('2021-07-21'),
                    },
                    { skipPageIndexing: true },
                )
                await backgroundModules.contentSharing.setAnnotationPrivacyLevel(
                    {
                        annotation: publicAnnotation3,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    },
                )
                console.log(
                    `Added upload error generating note to '${testPageUrl}'`,
                )
            }
            if (shouldTest('errors.download')) {
                const publicAnnotation4 = await backgroundModules.directLinking.createAnnotation(
                    {
                        tab: {} as any,
                    },
                    {
                        pageUrl: normalizedTestPageUrl,
                        comment: `*memex-debug*: download error`,
                        createdWhen: new Date('2021-07-21'),
                    },
                    { skipPageIndexing: true },
                )
                await backgroundModules.contentSharing.setAnnotationPrivacyLevel(
                    {
                        annotation: publicAnnotation4,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    },
                )
                console.log(
                    `Added download error generating note to '${testPageUrl}'`,
                )
            }

            let testListId1: number
            let testListId2: number
            if (shouldTest('list') || shouldTest('share')) {
                testListId1 = await backgroundModules.customLists.createCustomList(
                    {
                        name: 'My test list #1',
                    },
                )
                testListId2 = await backgroundModules.customLists.createCustomList(
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
            }
            if (shouldTest('copy-paste')) {
                await backgroundModules.copyPaster.createTemplate({
                    title: 'Test template',
                    code: 'Soem test code {{{PageTitle}}}',
                    isFavourite: false,
                })
                console.log(`Added test copy-paster template`)
            }

            let remoteListId1: string
            if (shouldTest('share')) {
                remoteListId1 = (
                    await backgroundModules.contentSharing.shareList({
                        listId: testListId1,
                    })
                ).remoteListId
                console.log('Shared test list #1, remote ID:', remoteListId1)

                const {
                    remoteListId: remoteListId2,
                } = await backgroundModules.contentSharing.shareList({
                    listId: testListId2,
                })
                console.log('Shared test list #2, remote ID:', remoteListId2)

                if (shouldTest('share.note')) {
                    await serverStorage.storageModules.contentSharing.ensurePageInfo(
                        {
                            creatorReference: {
                                type: 'user-reference',
                                id: user.id,
                            },
                            pageInfo: {
                                normalizedUrl: normalizedTestPageUrl,
                                originalUrl: testPageUrl,
                            },
                        },
                    )
                    await backgroundModules.contentSharing.shareAnnotation({
                        annotationUrl: publicAnnotationUrl,
                        shareToLists: true,
                    })
                    if (shouldTest('share.note.edit')) {
                        await backgroundModules.directLinking.editAnnotation(
                            null,
                            publicAnnotationUrl,
                            'Edited comment',
                        )
                    }
                    console.log('Shared and edited annotation')

                    let sharedAnnotationId: string | number
                    if (shouldTest('share.note.remove')) {
                        sharedAnnotationId = (
                            await backgroundModules.contentSharing.storage.getRemoteAnnotationIds(
                                {
                                    localIds: [publicAnnotationUrl],
                                },
                            )
                        )[publicAnnotationUrl]
                        await backgroundModules.directLinking.annotationStorage.deleteAnnotation(
                            publicAnnotationUrl,
                        )
                        console.log(
                            'Deleted shared annotation',
                            sharedAnnotationId,
                        )
                    }
                }

                if (shouldTest('share.incoming.note')) {
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
                }
            }

            if (shouldTest('pdf.online')) {
                await backgroundModules.pages.indexPage({
                    fullUrl:
                        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                })
            }

            await personalCloud.waitForSync()
            console.log('Waited for sync to cloud from this device')

            if (shouldTest('share.incoming.note')) {
                const sharedAnnotationEntries = await serverStorage.storageModules.contentSharing.getAnnotationListEntries(
                    {
                        listReference: {
                            type: 'shared-list-reference',
                            id: remoteListId1,
                        },
                    },
                )
                console.log({ sharedAnnotationEntries })
            }

            if (shouldTest('lots-of-data')) {
                for (let i = 0; i < 50; ++i) {
                    const normalizedUrl = `example.com/test-${i}`
                    const fullUrl = `https://www.example.com/test-${i}`
                    await backgroundModules.pages.storage.createPage({
                        url: normalizedUrl,
                        domain: 'www.example.com',
                        hostname: 'example.com',
                        fullTitle: `Example.com test ${i}`,
                        titleTerms: ['example', 'test'],
                        fullUrl,
                        tags: [],
                        terms: [],
                        text: '',
                        urlTerms: [],
                    })
                    await backgroundModules.bookmarks.addBookmark({
                        url: normalizedUrl,
                        fullUrl,
                        skipIndexing: true,
                    })
                }
            }

            console.log('End of self test')
        },
        cloudReceive: async () => {
            await clearDb(options.storageManager)
            console.log('Cleared local database')

            await ensureTestUser()
            await personalCloud.options.settingStore.set('deviceId', null)
            await personalCloud.startSync()
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
