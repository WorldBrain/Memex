import expect from 'expect'
import update from 'immutability-helper'

import * as DATA from 'src/readwise-integration/background/index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
} from 'src/tests/integration-tests'
import { injectFakeTabs } from 'src/tab-management/background/index.tests'
import { READWISE_API_URL } from './constants'
import fetchMock from 'fetch-mock'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Readwise Annotations',
    [
        backgroundIntegrationTest(
            'should instantiate ReadwiseBackground, run ReadwiseBackground.setup, and find no key',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                expect(
                                    await setup.backgroundModules.readwise.getAPIKey(),
                                ).toBeUndefined()
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest('should retrieve a saved API key', () => {
            return {
                steps: [
                    {
                        execute: async ({ setup }) => {
                            await setup.browserLocalStorage.set({
                                'readwise.apiKey': 'my key',
                            })
                            expect(
                                await setup.backgroundModules.readwise.getAPIKey(),
                            ).toEqual('my key')
                        },
                    },
                ],
            }
        }),
        backgroundIntegrationTest(
            'should store and retrieve the api key',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )
                                expect(
                                    await setup.browserLocalStorage.get(
                                        'readwise.apiKey',
                                    ),
                                ).toEqual({
                                    'readwise.apiKey': 'my key',
                                })
                                expect(
                                    await setup.backgroundModules.readwise.getAPIKey(),
                                ).toEqual('my key')
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest('should validate the api key', () => {
            return {
                steps: [
                    {
                        execute: async ({ setup }) => {
                            setup.fetch.getOnce(READWISE_API_URL, {
                                status: 204,
                            })
                            expect(
                                await setup.backgroundModules.readwise.validateAPIKey(
                                    {
                                        key: 'good key',
                                    },
                                ),
                            ).toEqual({ success: true })

                            setup.fetch.getOnce(
                                READWISE_API_URL,
                                {
                                    status: 403,
                                },
                                { overwriteRoutes: true },
                            )
                            expect(
                                await setup.backgroundModules.readwise.validateAPIKey(
                                    {
                                        key: 'bad key',
                                    },
                                ),
                            ).toEqual({ success: false })

                            expectFetchCalls(setup.fetch.calls(), [
                                {
                                    url: READWISE_API_URL,
                                    headers: {
                                        Authorization: 'Token good key',
                                        'Content-Type': 'application/json',
                                    },
                                    method: 'GET',
                                },
                                {
                                    url: READWISE_API_URL,
                                    headers: {
                                        Authorization: 'Token bad key',
                                        'Content-Type': 'application/json',
                                    },
                                    method: 'GET',
                                },
                            ])
                        },
                    },
                ],
            }
        }),
        backgroundIntegrationTest(
            'should upload highlights to readwise when creating annotations',
            { skipConflictTests: true },
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )

                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [DATA.TEST_TAB_1, DATA.TEST_TAB_2],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })
                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    DATA.ANNOT_1,
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    DATA.ANNOT_2,
                                )
                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    DATA.UPLOADED_HIGHLIGHT_1(
                                                        firstAnnotationUrl,
                                                    ),
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    DATA.UPLOADED_HIGHLIGHT_2(
                                                        secondAnnotationUrl,
                                                    ),
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should substitute URL for missing title when uploading all highlights to readwise',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const omitTitle = ({
                                    title,
                                    pageTitle,
                                    ...data
                                }: any): any => data

                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [
                                        omitTitle(DATA.TEST_TAB_1),
                                        omitTitle(DATA.TEST_TAB_2),
                                    ],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })

                                await setup.storageManager
                                    .collection('pages')
                                    .createObject(omitTitle(DATA.PAGE_1))
                                await setup.storageManager
                                    .collection('pages')
                                    .createObject(omitTitle(DATA.PAGE_2))

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: omitTitle(DATA.TEST_TAB_1) },
                                    omitTitle(DATA.ANNOT_1),
                                    { skipPageIndexing: true },
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: omitTitle(DATA.TEST_TAB_2) },
                                    omitTitle(DATA.ANNOT_2),
                                    { skipPageIndexing: true },
                                )
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )
                                setup.backgroundModules.readwise.uploadBatchSize = 1
                                await setup.backgroundModules.readwise.uploadAllAnnotations(
                                    {
                                        queueInteraction: 'queue-and-return',
                                    },
                                )
                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...DATA.UPLOADED_HIGHLIGHT_1(
                                                            firstAnnotationUrl,
                                                        ),
                                                        title:
                                                            DATA.TEST_TAB_1
                                                                .normalized,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...DATA.UPLOADED_HIGHLIGHT_2(
                                                            secondAnnotationUrl,
                                                        ),
                                                        title:
                                                            DATA.TEST_TAB_2
                                                                .normalized,
                                                    },
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should substitute URL for missing title when uploading highlight on annotation creation',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                const omitTitle = ({
                                    title,
                                    pageTitle,
                                    ...data
                                }: any): any => data

                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )

                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [
                                        omitTitle(DATA.TEST_TAB_1),
                                        omitTitle(DATA.TEST_TAB_2),
                                    ],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })

                                await setup.storageManager
                                    .collection('pages')
                                    .createObject(omitTitle(DATA.PAGE_1))
                                await setup.storageManager
                                    .collection('pages')
                                    .createObject(omitTitle(DATA.PAGE_2))

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: omitTitle(DATA.TEST_TAB_1) },
                                    omitTitle(DATA.ANNOT_1),
                                    { skipPageIndexing: true },
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: omitTitle(DATA.TEST_TAB_2) },
                                    omitTitle(DATA.ANNOT_2),
                                    { skipPageIndexing: true },
                                )

                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...DATA.UPLOADED_HIGHLIGHT_1(
                                                            firstAnnotationUrl,
                                                        ),
                                                        title:
                                                            DATA.TEST_TAB_1
                                                                .normalized,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...DATA.UPLOADED_HIGHLIGHT_2(
                                                            secondAnnotationUrl,
                                                        ),
                                                        title:
                                                            DATA.TEST_TAB_2
                                                                .normalized,
                                                    },
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should prepend any annotation tags to note text when uploading highlights to readwise',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [DATA.TEST_TAB_1, DATA.TEST_TAB_2],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    DATA.ANNOT_1,
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_1,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_2,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_3,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    DATA.ANNOT_2,
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    {
                                        tag: DATA.TAG_2,
                                        url: secondAnnotationUrl,
                                    },
                                )

                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )
                                setup.backgroundModules.readwise.uploadBatchSize = 1
                                await setup.backgroundModules.readwise.uploadAllAnnotations(
                                    {
                                        queueInteraction: 'queue-and-return',
                                    },
                                )
                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                const expectedHighlight1 = DATA.UPLOADED_HIGHLIGHT_1(
                                    firstAnnotationUrl,
                                )
                                const expectedHighlight2 = DATA.UPLOADED_HIGHLIGHT_2(
                                    secondAnnotationUrl,
                                )

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_2} .${DATA.TAG_3}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight2,
                                                        note:
                                                            `.${DATA.TAG_2}\n` +
                                                            expectedHighlight2.note,
                                                    },
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should prepend any annotation tags to note text when uploading highlights to readwise on tag creation',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )

                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [DATA.TEST_TAB_1, DATA.TEST_TAB_2],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    DATA.ANNOT_1,
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_1,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_2,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_3,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    DATA.ANNOT_2,
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    {
                                        tag: DATA.TAG_2,
                                        url: secondAnnotationUrl,
                                    },
                                )

                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                const expectedHighlight1 = DATA.UPLOADED_HIGHLIGHT_1(
                                    firstAnnotationUrl,
                                )
                                const expectedHighlight2 = DATA.UPLOADED_HIGHLIGHT_2(
                                    secondAnnotationUrl,
                                )

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    expectedHighlight1,
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_2}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_2} .${DATA.TAG_3}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    expectedHighlight2,
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight2,
                                                        note:
                                                            `.${DATA.TAG_2}\n` +
                                                            expectedHighlight2.note,
                                                    },
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should remove tags from note text when uploading highlights to readwise on tag deletion',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )

                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [DATA.TEST_TAB_1, DATA.TEST_TAB_2],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    DATA.ANNOT_1,
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_1,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_2,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_3,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.delTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_2,
                                        url: firstAnnotationUrl,
                                    },
                                )

                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                const expectedHighlight1 = DATA.UPLOADED_HIGHLIGHT_1(
                                    firstAnnotationUrl,
                                )

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    expectedHighlight1,
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_2}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_2} .${DATA.TAG_3}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_3}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should sub tags with spaces in them for hyphens',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )

                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [DATA.TEST_TAB_1, DATA.TEST_TAB_2],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    DATA.ANNOT_1,
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_1,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_2,
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: 'test tag  with   whitespace',
                                        url: firstAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        tag: DATA.TAG_3,
                                        url: firstAnnotationUrl,
                                    },
                                )

                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                const expectedHighlight1 = DATA.UPLOADED_HIGHLIGHT_1(
                                    firstAnnotationUrl,
                                )

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    expectedHighlight1,
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_2}\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_2} .test-tag-with-whitespace\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${DATA.TAG_2} .${DATA.TAG_3} .test-tag-with-whitespace\n` +
                                                            expectedHighlight1.note,
                                                    },
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should sync annotation updates to Readwise',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )

                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [DATA.TEST_TAB_1, DATA.TEST_TAB_2],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })
                                const annotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    DATA.ANNOT_1,
                                )
                                await setup.backgroundModules.readwise.actionQueue.waitForSync()
                                setup.fetch.resetHistory()

                                await setup.backgroundModules.directLinking.editAnnotation(
                                    null,
                                    annotationUrl,
                                    'updated comment',
                                )
                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    {
                                                        ...DATA.UPLOADED_HIGHLIGHT_1(
                                                            annotationUrl,
                                                        ),
                                                        note: 'updated comment',
                                                    },
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should sync existing annotations to Readwise',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                injectFakeTabs({
                                    tabManagement:
                                        setup.backgroundModules.tabManagement,
                                    tabsAPI: setup.browserAPIs.tabs,
                                    tabs: [DATA.TEST_TAB_1, DATA.TEST_TAB_2],
                                    includeTitle: true,
                                })
                                setup.fetch.post(READWISE_API_URL, {
                                    status: 200,
                                })
                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    DATA.ANNOT_1,
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    DATA.ANNOT_2,
                                )
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )
                                setup.backgroundModules.readwise.uploadBatchSize = 1
                                await setup.backgroundModules.readwise.uploadAllAnnotations(
                                    {
                                        queueInteraction: 'queue-and-return',
                                    },
                                )
                                await setup.backgroundModules.readwise.actionQueue.waitForSync()

                                expectFetchCalls(
                                    parseJsonFetchCalls(setup.fetch.calls()),
                                    [
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    DATA.UPLOADED_HIGHLIGHT_1(
                                                        firstAnnotationUrl,
                                                    ),
                                                ],
                                            }),
                                        },
                                        {
                                            url: READWISE_API_URL,
                                            ...DATA.UPLOAD_REQUEST({
                                                token: 'my key',
                                                highlights: [
                                                    DATA.UPLOADED_HIGHLIGHT_2(
                                                        secondAnnotationUrl,
                                                    ),
                                                ],
                                            }),
                                        },
                                    ],
                                )
                            },
                        },
                    ],
                }
            },
        ),
    ],
)

function parseJsonFetchCalls(calls: fetchMock.MockCall[]) {
    return calls.map((call) =>
        update(call, {
            1: {
                body: {
                    $apply: (body) => JSON.parse(body as string),
                },
            },
        }),
    )
}

// Needed because these calls are not plain objects
function expectFetchCalls(
    calls: fetchMock.MockCall[],
    expected: Array<{
        url: string
        method: string
        headers: { [key: string]: string }
        body?: any
    }>,
) {
    expect(
        calls.map(([url, data]) => ({
            url,
            method: data.method,
            headers: data.headers,
            body: data.body,
        })),
    ).toEqual(expected)
}
