import fs from 'fs'
import { setupSyncBackgroundTest, BASE_TIMESTAMP } from './index.tests'
import { StorexPersonalCloudBackend } from '@worldbrain/memex-common/lib/personal-cloud/backend/storex'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { PersonalCloudAction, PushObjectAction } from './types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { PersonalCloudOverwriteUpdate } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { injectFakeTabs } from 'src/tab-management/background/index.tests'
import { StoredContentType } from 'src/page-indexing/background/types'
import {
    TEST_PDF_PATH,
    TEST_PDF_METADATA,
    TEST_PDF_PAGE_TEXTS,
} from 'src/tests/test.data'
import { blobToJson } from 'src/util/blob-utils'

describe('Personal cloud', () => {
    const testFullPage = async (testOptions: {
        type: 'html' | 'pdf'
        source: 'tab' | 'url'
    }) => {
        const { setups } = await setupSyncBackgroundTest({
            deviceCount: 2,
            fetchPageData: async () => ({
                htmlBody,
                content: {
                    fullText,
                    title: fullTitle,
                },
            }),
        })

        const fullUrl =
            testOptions.type === 'html'
                ? 'http://www.thetest.com/home'
                : 'https://memex.cloud/ct/test-fingerprint.pdf'
        const fullTitle = `The Test`
        const fullText =
            testOptions.type === 'html'
                ? `the lazy fox jumped over something I can't remember!`
                : `wonderful pdf test monkey banana`

        const terms =
            testOptions.type === 'html'
                ? ['lazy', 'fox', 'jumped', 'remember']
                : fullText.split(' ')
        const htmlBody = `<strong>${fullText}</strong>`

        const test = async () => {
            const executedActions: PersonalCloudAction[] = []
            setups[0].backgroundModules.personalCloud.reportExecutingAction = (
                action,
            ) => {
                executedActions.push(action)
            }

            if (testOptions.source === 'tab') {
                // if (testOptions.type === 'pdf') {
                //     const pdfContent = new Uint8Array(
                //         fs.readFileSync(TEST_PDF_PATH),
                //     )
                //     const pdfBlob = new Blob([pdfContent], {
                //         type: 'application/pdf',
                //     })
                //     setups[0].backgroundModules.pages.fetch = async (url) => {
                //         return {
                //             status: 200,
                //             blob: async () => pdfBlob,
                //         } as any
                //     }
                // }
                injectFakeTabs({
                    tabManagement: setups[0].backgroundModules.tabManagement,
                    tabsAPI: setups[0].browserAPIs.tabs,
                    includeTitle: true,
                    tabs:
                        testOptions.type === 'html'
                            ? [
                                  {
                                      id: 667,
                                      url: fullUrl,
                                      htmlBody,
                                      title: fullTitle,
                                      // favIcon: 'data:,fav%20icon',
                                  },
                              ]
                            : [
                                  {
                                      id: 667,
                                      type: 'pdf',
                                      url: fullUrl,
                                  },
                              ],
                })
            }

            await setups[0].backgroundModules.pages.indexPage({
                fullUrl,
                tabId: 667,
            })

            const expectPageContent = async (
                setup: BackgroundIntegrationTestSetup,
            ) => {
                const docContent = await setup.persistentStorageManager
                    .collection('docContent')
                    .findObjects({})
                if (testOptions.type === 'html') {
                    expect(docContent).toEqual([
                        {
                            id: expect.any(Number),
                            normalizedUrl: 'thetest.com/home',
                            storedContentType: StoredContentType.HtmlBody,
                            content: htmlBody,
                        },
                    ])
                } else {
                    expect(docContent).toEqual([
                        {
                            id: expect.any(Number),
                            normalizedUrl:
                                'memex.cloud/ct/test-fingerprint.pdf',
                            storedContentType: StoredContentType.PdfContent,
                            content: {
                                metadata: {
                                    ...TEST_PDF_METADATA,
                                    memexDocumentBytes: expect.any(Number),
                                },
                                pageTexts: TEST_PDF_PAGE_TEXTS,
                            },
                        },
                    ])
                }
                const pages = await setup.storageManager
                    .collection('pages')
                    .findObjects({})
                expect(pages).toEqual([
                    expect.objectContaining({
                        text: fullText,
                        terms,
                    }),
                ])
            }

            await expectPageContent(setups[0])
            await setups[0].backgroundModules.personalCloud.waitForSync()

            if (executedActions.length) {
                expect(executedActions).toEqual([
                    expect.objectContaining({
                        type: 'push-object',
                        updates: [
                            expect.objectContaining({
                                type: 'overwrite',
                                collection: 'pages',
                                schemaVersion: STORAGE_VERSIONS[26].version,
                            }),
                        ],
                    }),
                    expect.objectContaining({
                        type: 'execute-client-instruction',
                    }),
                ])
                const firstAction = executedActions[0] as PushObjectAction
                const firstUpdate = firstAction
                    .updates[0] as PersonalCloudOverwriteUpdate
                const forbiddenFields = new Set([
                    'terms',
                    'titleTerms',
                    'urlTerms',
                    'text',
                ])
                const presentForbiddenFields = new Set(
                    Object.keys(firstUpdate.object).filter((key) =>
                        forbiddenFields.has(key),
                    ),
                )
                expect(presentForbiddenFields).toEqual(new Set())
            }

            const firstCloudBackend = setups[0].backgroundModules.personalCloud
                .options.backend as StorexPersonalCloudBackend
            if (testOptions.type === 'html') {
                expect(
                    firstCloudBackend.options.view.hub.storedObjects,
                ).toEqual([
                    {
                        path: expect.stringMatching(
                            new RegExp(`^/u/${TEST_USER.id}/docContent/.+$`),
                        ),
                        object: htmlBody,
                        contentType: 'application/x-memex-html-body',
                    },
                ])
            } else {
                const { storedObjects } = firstCloudBackend.options.view.hub
                expect(storedObjects).toEqual([
                    {
                        path: expect.stringMatching(
                            new RegExp(`^/u/${TEST_USER.id}/docContent/.+$`),
                        ),
                        object: expect.any(Blob),
                        contentType: 'application/x-memex-pdf-content',
                    },
                ])
                const objectBlob = storedObjects[0].object as Blob
                const object = await blobToJson(objectBlob)
                expect(object).toEqual({
                    metadata: {
                        ...TEST_PDF_METADATA,
                        memexDocumentBytes: expect.any(Number),
                    },
                    pageTexts: TEST_PDF_PAGE_TEXTS,
                })
                expect(objectBlob.type).toEqual(
                    'application/x-memex-pdf-content',
                )
            }

            await setups[1].backgroundModules.personalCloud.waitForSync()
            await setups[1].backgroundModules.personalCloud.integrateAllUpdates()
            await expectPageContent(setups[1])
        }
        await test()
        await test()
    }

    // TODO: Fix this test
    it('should sync full page HTML texts indexed from tabs', async () => {
        return
        await testFullPage({ type: 'html', source: 'tab' })
    })
    // TODO: Fix this test
    it('should sync full page HTML texts indexed from URLs', async () => {
        return
        await testFullPage({ type: 'html', source: 'url' })
    })

    // TODO: Fix this test
    it('should sync full page PDF texts indexed from tabs', async function () {
        return
        await testFullPage({ type: 'pdf', source: 'tab' })
    })

    it('should start sync right away if sync is already set up', async () => {
        const { setups } = await setupSyncBackgroundTest({
            deviceCount: 1,
            startWithSyncDisabled: false,
        })

        const { personalCloud } = setups[0].backgroundModules

        expect(await personalCloud.options.settingStore.get('isSetUp')).toBe(
            true,
        )
        expect(personalCloud.actionQueue.isPaused).toBe(false)
        expect(personalCloud.authChangesObserved).not.toBeUndefined()
        expect(personalCloud.changesIntegrating).not.toBeUndefined()
    })

    it(`should not do weird stuff if you start sync when it's already started`, async () => {
        const { setups } = await setupSyncBackgroundTest({
            deviceCount: 1,
            startWithSyncDisabled: false,
        })

        const { personalCloud } = setups[0].backgroundModules

        await personalCloud.enableSync()
        await personalCloud.startSync()

        expect(await personalCloud.options.settingStore.get('isSetUp')).toBe(
            true,
        )
        expect(personalCloud.actionQueue.isPaused).toBe(false)
        expect(personalCloud.authChangesObserved).not.toBeUndefined()
        expect(personalCloud.changesIntegrating).not.toBeUndefined()

        const authChangesPromiseBefore = personalCloud.authChangesObserved
        const changesIntegratingPromiseBefore = personalCloud.changesIntegrating

        await personalCloud.startSync()

        expect(await personalCloud.options.settingStore.get('isSetUp')).toBe(
            true,
        )
        expect(personalCloud.actionQueue.isPaused).toBe(false)
        expect(personalCloud.authChangesObserved).not.toBeUndefined()
        expect(authChangesPromiseBefore).toEqual(
            personalCloud.authChangesObserved,
        )
        expect(personalCloud.changesIntegrating).not.toBeUndefined()
        expect(changesIntegratingPromiseBefore).toEqual(
            personalCloud.changesIntegrating,
        )
    })

    it.skip('should enable and start sync only after data migration prep is complete', async () => {
        const { setups } = await setupSyncBackgroundTest({
            deviceCount: 1,
            startWithSyncDisabled: true,
        })

        const { personalCloud } = setups[0].backgroundModules

        expect(
            await personalCloud.options.settingStore.get('isSetUp'),
        ).not.toBe(true)
        expect(personalCloud.actionQueue.isPaused).toBe(true)
        expect(personalCloud.authChangesObserved).toBeUndefined()
        expect(personalCloud.changesIntegrating).toBeUndefined()

        await personalCloud['prepareDataMigration']()

        expect(await personalCloud.options.settingStore.get('isSetUp')).toBe(
            true,
        )
        expect(personalCloud.actionQueue.isPaused).toBe(false)
        expect(personalCloud.authChangesObserved).not.toBeUndefined()
        expect(personalCloud.changesIntegrating).not.toBeUndefined()
    })

    it.skip('should enable and start sync only after data migration prep is complete', async () => {
        const { setups } = await setupSyncBackgroundTest({
            deviceCount: 1,
            startWithSyncDisabled: true,
        })

        const { personalCloud } = setups[0].backgroundModules

        expect(
            await personalCloud.options.settingStore.get('isSetUp'),
        ).not.toBe(true)
        expect(personalCloud.actionQueue.isPaused).toBe(true)
        expect(personalCloud.authChangesObserved).toBeUndefined()
        expect(personalCloud.changesIntegrating).toBeUndefined()

        await personalCloud['prepareDataMigration']()

        expect(await personalCloud.options.settingStore.get('isSetUp')).toBe(
            true,
        )
        expect(personalCloud.actionQueue.isPaused).toBe(false)
        expect(personalCloud.authChangesObserved).not.toBeUndefined()
        expect(personalCloud.changesIntegrating).not.toBeUndefined()
    })

    it.skip(`should schedule showing pioneer subscription banner in 2 weeks after enabling on new install`, async () => {
        const { setups } = await setupSyncBackgroundTest({
            deviceCount: 1,
            startWithSyncDisabled: true,
        })

        const { bgScript } = setups[0].backgroundModules

        const now = Date.now()
        const fortnightFromNow = now + 1000 * 60 * 60 * 24 * 7 * 2

        expect(
            await bgScript.deps.syncSettingsStore.dashboard.get(
                'subscribeBannerShownAfter',
            ),
        ).toEqual(null)
        await bgScript.handleInstallLogic(now)
        expect(
            await bgScript.deps.syncSettingsStore.dashboard.get(
                'subscribeBannerShownAfter',
            ),
        ).toEqual(fortnightFromNow)
    })
    // TODO: Fix this test
    it(`should add new lists to the list suggestion cache on incoming data write`, async () => {
        return
        const { setups } = await setupSyncBackgroundTest({
            deviceCount: 2,
            startWithSyncDisabled: false,
        })

        const assertCacheEntries = async (expected: number[]) => {
            const expectedStorage =
                expected.length === 0
                    ? {}
                    : { ['custom-lists_suggestionIds']: expected }

            expect(
                await setups[0].browserLocalStorage.get(
                    'custom-lists_suggestionIds',
                ),
            ).toEqual(expectedStorage)
            expect(
                await setups[1].browserLocalStorage.get(
                    'custom-lists_suggestionIds',
                ),
            ).toEqual(expectedStorage)
        }

        const waitForSync = async () => {
            await setups[0].backgroundModules.personalCloud.waitForSync()
            await setups[1].backgroundModules.personalCloud.integrateAllUpdates()
            await setups[1].backgroundModules.personalCloud.waitForSync()
        }

        await assertCacheEntries([])
        await setups[0].backgroundModules.customLists.createCustomList({
            id: 1,
            name: 'list 1',
        })

        expect(
            await setups[1].backgroundModules.personalCloud.options.settingStore.get(
                'lastSeen',
            ),
        ).toEqual(null)

        await waitForSync()

        expect(
            await setups[1].backgroundModules.personalCloud.options.settingStore.get(
                'lastSeen',
            ),
        ).toEqual(BASE_TIMESTAMP)

        await assertCacheEntries([1])

        await setups[0].backgroundModules.customLists.createCustomList({
            id: 2,
            name: 'list 2',
        })
        await waitForSync()

        expect(
            await setups[1].backgroundModules.personalCloud.options.settingStore.get(
                'lastSeen',
            ),
        ).toEqual(BASE_TIMESTAMP + 1)

        await assertCacheEntries([2, 1])

        await setups[0].backgroundModules.customLists.updateList({
            id: 1,
            oldName: 'list 1',
            newName: 'list 1 updated',
        })
        await waitForSync()

        expect(
            await setups[1].backgroundModules.personalCloud.options.settingStore.get(
                'lastSeen',
            ),
        ).toEqual(BASE_TIMESTAMP + 2)

        await assertCacheEntries([2, 1]) // Updates should not affect cache

        await setups[0].backgroundModules.customLists.createCustomList({
            id: 3,
            name: 'list 3',
        })
        await waitForSync()

        expect(
            await setups[1].backgroundModules.personalCloud.options.settingStore.get(
                'lastSeen',
            ),
        ).toEqual(BASE_TIMESTAMP + 3)

        await assertCacheEntries([3, 2, 1])
    })
})
