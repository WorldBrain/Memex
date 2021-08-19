import fs from 'fs'
import { setupSyncBackgroundTest } from './index.tests'
import { StorexPersonalCloudBackend } from '@worldbrain/memex-common/lib/personal-cloud/backend/storex'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'
import { PersonalCloudAction, PushObjectAction } from './types'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { PersonalCloudOverwriteUpdate } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import { injectFakeTabs } from 'src/tab-management/background/index.tests'
import { MockFetchPageDataProcessor } from 'src/page-analysis/background/mock-fetch-page-data-processor'
import pipeline from 'src/search/pipeline'
import { StoredContentType } from 'src/page-indexing/background/types'
import {
    TEST_PDF_PATH,
    TEST_PDF_METADATA,
    TEST_PDF_PAGE_TEXTS,
} from 'src/tests/test.data'
import { blobToJson } from 'src/util/blob-utils'
import { AnnotationPrivacyLevels, Annotation } from '../../annotations/types'
import {
    PersonalCloudErrorType,
    DataChangeType,
} from '../../../external/@worldbrain/memex-common/ts/personal-cloud/storage/types'

describe('Personal cloud', () => {
    const testFullPage = async (testOptions: {
        type: 'html' | 'pdf'
        source: 'tab' | 'url'
    }) => {
        const { setups } = await setupSyncBackgroundTest({
            deviceCount: 2,
            useDownloadTranslationLayer: true,
        })

        const fullUrl =
            testOptions.type === 'html'
                ? 'http://www.thetest.com/home'
                : 'https://www.dude-wheres-my/test.pdf'
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
                if (testOptions.type === 'pdf') {
                    const pdfContent = new Uint8Array(
                        fs.readFileSync(TEST_PDF_PATH),
                    )
                    const pdfBlob = new Blob([pdfContent], {
                        type: 'application/pdf',
                    })
                    setups[0].backgroundModules.pages.fetch = async (url) => {
                        return {
                            status: 200,
                            blob: async () => pdfBlob,
                        } as any
                    }
                }
                injectFakeTabs({
                    tabManagement: setups[0].backgroundModules.tabManagement,
                    tabsAPI: setups[0].browserAPIs.tabs,
                    includeTitle: true,
                    tabs:
                        testOptions.type === 'html'
                            ? [
                                  {
                                      url: fullUrl,
                                      htmlBody,
                                      title: fullTitle,
                                      // favIcon: 'data:,fav%20icon',
                                  },
                              ]
                            : [
                                  {
                                      type: 'pdf',
                                      url: fullUrl,
                                  },
                              ],
                })
            }
            if (testOptions.source === 'url') {
                setups[0].backgroundModules.pages.options.fetchPageData = new MockFetchPageDataProcessor(
                    await pipeline({
                        pageDoc: {
                            url: fullUrl,
                            content: {
                                fullText,
                                title: fullTitle,
                            },
                        },
                    }),
                    { htmlBody },
                )
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
                            normalizedUrl: 'www.dude-wheres-my/test.pdf',
                            storedContentType: StoredContentType.PdfContent,
                            content: {
                                metadata: TEST_PDF_METADATA,
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
                                schemaVersion: STORAGE_VERSIONS[25].version,
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
                    metadata: TEST_PDF_METADATA,
                    pageTexts: TEST_PDF_PAGE_TEXTS,
                })
                expect(objectBlob.type).toEqual(
                    'application/x-memex-pdf-content',
                )
            }

            await setups[1].backgroundModules.personalCloud.waitForSync()
            await expectPageContent(setups[1])
        }
        await test()
        await test()
    }

    it('should sync full page HTML texts indexed from tabs', async () => {
        await testFullPage({ type: 'html', source: 'tab' })
    })

    it('should sync full page HTML texts indexed from URLs', async () => {
        await testFullPage({ type: 'html', source: 'url' })
    })

    it('should sync full page PDF texts indexed from tabs', async function () {
        await testFullPage({ type: 'pdf', source: 'tab' })
    })

    const testTranslationError = async (options: {
        annotationComment: string
        errorType: PersonalCloudErrorType
        errorMessage: string
        errorDeviceIndex: number
        stackSubstring: string
        createdWhen: number
        errorData: (options: {
            setups: BackgroundIntegrationTestSetup[]
            userId: number | string
            annotation: Pick<Annotation, 'url' | 'pageUrl' | 'comment'>
        }) => any
    }) => {
        const { setups, serverStorage } = await setupSyncBackgroundTest({
            deviceCount: 2,
            useDownloadTranslationLayer: true,
        })
        // setups[0].backgroundModules.personalCloud.debug = true
        // setups[1].backgroundModules.personalCloud.debug = true
        const testPageUrl = 'https://www.getmemex.com/'
        const normalizedTestPageUrl = 'getmemex.com'

        injectFakeTabs({
            tabManagement: setups[0].backgroundModules.tabManagement,
            tabsAPI: setups[0].browserAPIs.tabs,
            includeTitle: true,
            tabs: [
                {
                    url: testPageUrl,
                    htmlBody: '<strong>test</strong>',
                    title: 'test page',
                },
            ],
        })

        const annotation = {
            pageUrl: testPageUrl,
            comment: options.annotationComment,
            privacyLevel: AnnotationPrivacyLevels.PROTECTED,
            createdWhen: new Date('2021-07-21'),
        }
        const annotationUrl = await setups[0].backgroundModules.directLinking.createAnnotation(
            { tab: { id: 1 } as any },
            annotation,
        )
        annotation.pageUrl = normalizedTestPageUrl

        await setups[0].backgroundModules.personalCloud.waitForSync()
        await setups[1].backgroundModules.personalCloud.waitForSync()

        const errors = (
            await serverStorage.storageManager
                .collection('personalCloudError')
                .findObjects({})
        ).map((error: any) => ({ ...error, data: JSON.parse(error.data) }))

        const userId = (
            await setups[0].backgroundModules.auth.authService.getCurrentUser()
        ).id
        expect(errors).toEqual([
            {
                id: expect.anything(),
                createdByDevice:
                    setups[options.errorDeviceIndex].backgroundModules
                        .personalCloud.deviceId,
                createdWhen: options.createdWhen,
                type: options.errorType,
                user: userId,
                data: {
                    error: {
                        name: 'Error',
                        message: options.errorMessage,
                        stack: expect.stringContaining(options.stackSubstring),
                    },
                    ...options.errorData({
                        userId,
                        annotation: { ...annotation, url: annotationUrl },
                        setups,
                    }),
                },
            },
        ])
    }

    it('should handle upload translation layer errors', async () => {
        await testTranslationError({
            annotationComment: `*memex-debug*: upload error`,
            errorType: PersonalCloudErrorType.UploadError,
            errorMessage: `You created a special annotation meant to create a server-side upload error`,
            stackSubstring: `upload.ts:`,
            createdWhen: 562,
            errorDeviceIndex: 0,
            errorData: (options) => ({
                update: {
                    type: 'overwrite',
                    collection: 'annotations',
                    deviceId:
                        options.setups[0].backgroundModules.personalCloud
                            .deviceId,
                    schemaVersion: options.setups[0].backgroundModules.personalCloud.currentSchemaVersion.toISOString(),
                    object: {
                        url: options.annotation.url,
                        pageUrl: options.annotation.pageUrl,
                        comment: options.annotation.comment,
                        createdWhen: expect.any(String),
                        lastEdited: expect.any(String),
                    },
                },
            }),
        })
    })

    it('should handle download translation layer errors', async () => {
        await testTranslationError({
            annotationComment: `*memex-debug*: download error`,
            errorType: PersonalCloudErrorType.DownloadError,
            errorMessage: `You created a special annotation meant to create a server-side download error`,
            stackSubstring: `download.ts:`,
            createdWhen: 563,
            errorDeviceIndex: 1,
            errorData: (options) => ({
                change: {
                    id: expect.anything(),
                    collection: 'personalAnnotation',
                    createdByDevice:
                        options.setups[0].backgroundModules.personalCloud
                            .deviceId,
                    createdWhen: 562,
                    objectId: expect.anything(),
                    type: DataChangeType.Create,
                    user: options.userId,
                },
            }),
        })
    })
})
