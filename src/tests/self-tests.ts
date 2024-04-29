import type { Storage } from 'webextension-polyfill'
import type StorageManager from '@worldbrain/storex'
import type { BackgroundModules } from 'src/background-script/setup'
import type { ServerStorage } from 'src/storage/types'
import type { WorldbrainAuthService } from '@worldbrain/memex-common/lib/authentication/worldbrain'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { SYNCED_SETTING_KEYS } from '@worldbrain/memex-common/lib/synced-settings/constants'
import type { ContentIdentifier } from '@worldbrain/memex-common/lib/page-indexing/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

type CloudSendTest =
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
    | 'pdf.online.share.note'
    | 'pdf.online.share.receive'

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

const personalCloudGetWhere = (
    serverStorage: ServerStorage,
    userId: AutoPk,
) => async (collectionName: string) => {
    if (!collectionName.startsWith('personal')) {
        return null
    }
    if (
        collectionName === 'personalBlockStats' ||
        collectionName === 'personalCloudError' ||
        collectionName === 'personalReadwiseAction' ||
        collectionName === 'personalUsageEntry' ||
        collectionName === 'personalAnalyticEvent' ||
        collectionName === 'personalAnalyticsStats'
    ) {
        return null
    }
    const objects = (await serverStorage.manager
        .collection(collectionName)
        .findObjects({
            user: userId,
        })) as any[]
    if (!objects.length) {
        return null
    }
    const where = {
        user: userId,
        id: { $in: objects.map((object) => object.id) },
    }
    return where
}

export function createSelfTests(options: {
    backgroundModules: BackgroundModules
    storageManager: StorageManager
    persistentStorageManager: StorageManager
    serverStorage: ServerStorage
    localStorage: Storage.LocalStorageArea
}) {
    const { backgroundModules } = options
    const { personalCloud } = backgroundModules

    const ensureTestUser = async (email = 'self-test-user@test.com') => {
        const authService = backgroundModules.auth
            .authService as WorldbrainAuthService
        try {
            await authService.loginWithEmailAndPassword(email, 'testing')
        } catch (e) {
            await authService.signupWithEmailAndPassword(email, 'testing')
        }
        const user = await authService.getCurrentUser()
        if (!user) {
            throw new Error(`Could not authenticate user`)
        }

        await options.serverStorage.modules.users.ensureUser(
            {
                displayName: `Test user (${email})`,
            },
            { type: 'user-reference', id: user.id },
        )

        return user
    }

    const tests = {
        cloudSend: async (testOptions?: {
            only?: CloudSendTest[]
            skip?: CloudSendTest[]
            enable?: CloudSendTest[]
        }) => {
            const shouldTest = (
                test: CloudSendTest,
                matchOptions?: { needsExplicitInclusion?: boolean },
            ) => {
                if (matchOptions?.needsExplicitInclusion) {
                    return testOptions?.enable?.includes?.(test)
                }
                return matchTest(test, testOptions)
            }

            console.log(
                'Turning off sync debug output for duration of self test',
            )
            backgroundModules.personalCloud.debug = false

            try {
                await clearDb(options.storageManager)
                await clearDb(options.persistentStorageManager)
                console.log('Cleared local databases')
                await personalCloud.options.settingStore.set('deviceId', null)

                const user = await ensureTestUser()
                console.log('Self test user:', user)

                await clearDb(options.serverStorage.manager, {
                    getWhere: personalCloudGetWhere(
                        options.serverStorage,
                        user.id,
                    ),
                })
                console.log('Cleared Firestore personal cloud collections')

                await personalCloud.startSync()
                console.log('Generated device ID:', personalCloud.deviceId!)

                if (process.env.TEST_READWISE_API_KEY?.length > 0) {
                    await backgroundModules.syncSettings.set({
                        [SYNCED_SETTING_KEYS.ReadwiseAPIKey]:
                            process.env.TEST_READWISE_API_KEY,
                    })
                    console.log('Set test Readwise API Key')
                }

                const testPageUrl = 'https://memex.garden'
                const testPageTitle = 'test title'
                const normalizedTestPageUrl = normalizeUrl(testPageUrl)
                await backgroundModules.pages.storage.createPage({
                    url: normalizedTestPageUrl,
                    domain: normalizedTestPageUrl,
                    hostname: normalizedTestPageUrl,
                    fullTitle: testPageTitle,
                    titleTerms: ['test', 'title'],
                    fullUrl: testPageUrl,
                    terms: ['memex', 'garden', 'test', 'self'],
                    text: '',
                    urlTerms: [],
                })

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
                            pageUrl: testPageUrl,
                            comment: 'Hi, this is a test comment',
                            title: testPageTitle,
                            createdWhen: new Date(),
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
                            pageUrl: testPageUrl,
                            comment: `Yet another test comment! This one's protected`,
                            title: testPageTitle,
                            createdWhen: new Date('2021-07-21'),
                        },
                        { skipPageIndexing: true },
                    )
                    await backgroundModules.contentSharing.setAnnotationPrivacyLevel(
                        {
                            annotationUrl: publicAnnotation2,
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
                            pageUrl: testPageUrl,
                            comment: `*memex-debug*: upload error`,
                            title: testPageTitle,
                            createdWhen: new Date('2021-07-21'),
                        },
                        { skipPageIndexing: true },
                    )
                    await backgroundModules.contentSharing.setAnnotationPrivacyLevel(
                        {
                            annotationUrl: publicAnnotation3,
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
                            pageUrl: testPageUrl,
                            comment: `*memex-debug*: download error`,
                            title: testPageTitle,
                            createdWhen: new Date('2021-07-21'),
                        },
                        { skipPageIndexing: true },
                    )
                    await backgroundModules.contentSharing.setAnnotationPrivacyLevel(
                        {
                            annotationUrl: publicAnnotation4,
                            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                        },
                    )
                    console.log(
                        `Added download error generating note to '${testPageUrl}'`,
                    )
                }

                let testListId1: number
                let testListId2: number
                if (
                    shouldTest('list') ||
                    shouldTest('share') ||
                    shouldTest('pdf.online.share')
                ) {
                    const res1 = await backgroundModules.customLists.createCustomList(
                        {
                            name: 'My test list #1',
                            id: Date.now(),
                        },
                    )
                    const res2 = await backgroundModules.customLists.createCustomList(
                        {
                            name: 'My test list #2',
                            id: Date.now(),
                        },
                    )
                    testListId1 = res1.localListId
                    testListId2 = res2.localListId
                    await backgroundModules.customLists.insertPageToList({
                        id: testListId1,
                        url: testPageUrl,
                        skipPageIndexing: true,
                    })
                    await backgroundModules.customLists.insertPageToList({
                        id: testListId2,
                        url: testPageUrl,
                        skipPageIndexing: true,
                    })
                    console.log(`Added 'https://getmemex.com' to 2 lists`)
                }
                if (shouldTest('copy-paste')) {
                    await backgroundModules.copyPaster.createTemplate({
                        title: 'Test template',
                        code: 'Soem test code {{{PageTitle}}}',
                        order: 2,
                        isFavourite: false,
                        outputFormat: 'markdown',
                    })
                    console.log(`Added test copy-paster template`)
                }

                let remoteListId1: string
                if (shouldTest('share') || shouldTest('pdf.online.share')) {
                    remoteListId1 = (
                        await backgroundModules.contentSharing.scheduleListShare(
                            {
                                localListId: testListId1,
                            },
                        )
                    ).remoteListId
                    console.log(
                        'Shared test list #1, remote ID:',
                        remoteListId1,
                    )

                    const {
                        remoteListId: remoteListId2,
                    } = await backgroundModules.contentSharing.scheduleListShare(
                        {
                            localListId: testListId2,
                        },
                    )
                    console.log(
                        'Shared test list #2, remote ID:',
                        remoteListId2,
                    )

                    await options.serverStorage.modules.contentSharing.ensurePageInfo(
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
                    if (shouldTest('share.note')) {
                        await backgroundModules.contentSharing.shareAnnotation({
                            annotationUrl: publicAnnotationUrl,
                            shareToParentPageLists: true,
                        })
                        if (shouldTest('share.note.edit')) {
                            await backgroundModules.directLinking.editAnnotation(
                                null,
                                publicAnnotationUrl,
                                'Edited comment',
                                'one',
                                'Edited body',
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
                        await options.serverStorage.modules.contentSharing.createAnnotations(
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
                                creator: {
                                    type: 'user-reference',
                                    id: user.id,
                                },
                                listReferences: [],
                            },
                        )
                    }
                }

                let primaryPdfIndentifier: ContentIdentifier
                // TODO: fix this case - currently always results in an error
                // if (shouldTest('pdf.online')) {
                //     const fullPdfUrl =
                //         'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                //     const normalizedPdfUrl = normalizeUrl(fullPdfUrl, {})
                //     await backgroundModules.pages.indexPage({
                //         fullUrl: fullPdfUrl,
                //     })
                //     primaryPdfIndentifier =
                //         backgroundModules.pages.contentInfo[normalizedPdfUrl]
                //             .primaryIdentifier
                //     if (shouldTest('pdf.online.share')) {
                //         await backgroundModules.customLists.insertPageToList({
                //             id: testListId1,
                //             url: primaryPdfIndentifier.fullUrl,
                //             skipPageIndexing: true,
                //         })
                //         console.log('Added PDF to shared list #1')

                //         if (shouldTest('pdf.online.share.note')) {
                //             const pdfAnnotationUrl = await backgroundModules.directLinking.createAnnotation(
                //                 {
                //                     tab: {} as any,
                //                 },
                //                 {
                //                     pageUrl: primaryPdfIndentifier.fullUrl,
                //                     comment: 'Hi, this is a test comment',
                //                     title: testPageTitle,
                //                     createdWhen: new Date(),
                //                 },
                //                 { skipPageIndexing: true },
                //             )
                //             await options.serverStorage.storageModules.contentSharing.ensurePageInfo(
                //                 {
                //                     creatorReference: {
                //                         type: 'user-reference',
                //                         id: user.id,
                //                     },
                //                     pageInfo: {
                //                         normalizedUrl: normalizedPdfUrl,
                //                         originalUrl: fullPdfUrl,
                //                     },
                //                 },
                //             )
                //             await backgroundModules.contentSharing.shareAnnotation({
                //                 annotationUrl: pdfAnnotationUrl,
                //                 shareToLists: true,
                //             })
                //             // await backgroundModules.contentSharing.setAnnotationPrivacyLevel({
                //             //     annotation: pdfAnnotationUrl,
                //             //     privacyLevel: AnnotationPrivacyLevels.SHARED,
                //             // })
                //             console.log('Shared PDF note to lists')
                //         }
                //     }
                // }

                await personalCloud.waitForSync()
                console.log('Waited for sync to cloud from this device')

                if (shouldTest('share.incoming.note')) {
                    const sharedAnnotationEntries = await options.serverStorage.modules.contentSharing.getAnnotationListEntries(
                        {
                            listReference: {
                                type: 'shared-list-reference',
                                id: remoteListId1,
                            },
                        },
                    )
                    console.log('Incoming note', { sharedAnnotationEntries })
                }

                if (
                    shouldTest('pdf.online.share.receive', {
                        needsExplicitInclusion: true,
                    })
                ) {
                    backgroundModules.auth.authService.signOut()
                    await ensureTestUser('two@test.com')
                    await options.serverStorage.modules.activityFollows.storeFollow(
                        {
                            collection: 'sharedList',
                            objectId: remoteListId1,
                            userReference: {
                                type: 'user-reference',
                                id: (
                                    await backgroundModules.auth.authService.getCurrentUser()
                                ).id,
                            },
                        },
                    )
                }

                if (
                    shouldTest('lots-of-data', { needsExplicitInclusion: true })
                ) {
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

                await personalCloud.enableSync()
                console.log('End of self test')
            } catch (err) {
                console.log('Self test encountered an error:')
                throw err
            } finally {
                console.log('Turning sync debug output back on')
                backgroundModules.personalCloud.debug = true
            }
        },
        cloudReceive: async () => {
            await clearDb(options.storageManager)
            await clearDb(options.persistentStorageManager)
            console.log('Cleared local databases')
            await personalCloud.options.settingStore.set('deviceId', null)

            const user = await ensureTestUser()
            console.log('Self test user:', user)

            await personalCloud.startSync()
            console.log('Generated device ID:', personalCloud.deviceId!)

            await personalCloud.waitForSync()
            console.log('Sync complete')

            await personalCloud.enableSync()
            console.log('End of self test')
        },
        ensureTestUser: async (email = 'test@test.com') => {
            await ensureTestUser(email)
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
