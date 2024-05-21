import expect from 'expect'
import update from 'immutability-helper'
import fetchMock from 'fetch-mock'

import * as DATA from 'src/readwise-integration/background/index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
} from 'src/tests/integration-tests'
import { injectFakeTabs } from 'src/tab-management/background/index.tests'
import { READWISE_API_URL } from '@worldbrain/memex-common/lib/readwise-integration/api/constants'
import { formatReadwiseHighlightTag } from '@worldbrain/memex-common/lib/readwise-integration/utils'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Readwise Annotations',
    [
        backgroundIntegrationTest(
            'should run ReadwiseBackground setup logic and find no key',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                expect(
                                    await setup.backgroundModules.readwise.getAPIKey(),
                                ).toBeNull()
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest('should retrieve a pre-saved API key', () => {
            return {
                steps: [
                    {
                        execute: async ({
                            setup: {
                                backgroundModules: {
                                    readwise,
                                    syncSettings: settings,
                                },
                            },
                        }) => {
                            await readwise['options'].settingsStore.set(
                                'apiKey',
                                'my key',
                            )
                            await settings.set({ 'readwise.apiKey': 'my key' })
                            expect(await readwise.getAPIKey()).toEqual('my key')
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
                                    await setup.backgroundModules.syncSettings.get(
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
        // TODO: Fix this test
        backgroundIntegrationTest(
            'should substitute URL for missing title when uploading all highlights to readwise',
            () => {
                return
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
                                const thirdAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: omitTitle(DATA.TEST_TAB_2) },
                                    omitTitle(DATA.ANNOT_3),
                                    { skipPageIndexing: true },
                                )
                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )
                                await setup.backgroundModules.readwise.uploadAllAnnotations(
                                    {},
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
                                                        ...DATA.UPLOADED_HIGHLIGHT_1(
                                                            firstAnnotationUrl,
                                                        ),
                                                        title:
                                                            DATA.TEST_TAB_1
                                                                .normalized,
                                                    },
                                                    {
                                                        ...DATA.UPLOADED_HIGHLIGHT_2(
                                                            secondAnnotationUrl,
                                                        ),
                                                        title:
                                                            DATA.TEST_TAB_2
                                                                .normalized,
                                                    },
                                                    {
                                                        ...DATA.UPLOADED_HIGHLIGHT_3(
                                                            thirdAnnotationUrl,
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
        // TODO: Fix this test
        backgroundIntegrationTest(
            'should prepend any annotation tags and spaces to note text when uploading highlights to readwise',
            () => {
                return
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

                                await setup.backgroundModules.customLists.createCustomList(
                                    DATA.LIST_1,
                                )
                                await setup.backgroundModules.customLists.createCustomList(
                                    DATA.LIST_2,
                                )

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        ...DATA.ANNOT_1,
                                        title: DATA.ANNOT_1.pageTitle,
                                    },
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
                                await setup.backgroundModules.contentSharing.shareAnnotationToSomeLists(
                                    {
                                        annotationUrl: firstAnnotationUrl,
                                        localListIds: [
                                            DATA.LIST_1.id,
                                            DATA.LIST_2.id,
                                        ],
                                    },
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    {
                                        ...DATA.ANNOT_2,
                                        title: DATA.ANNOT_2.pageTitle,
                                    },
                                )
                                await setup.backgroundModules.directLinking.addTagForAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    {
                                        tag: DATA.TAG_2,
                                        url: secondAnnotationUrl,
                                    },
                                )
                                await setup.backgroundModules.contentSharing.shareAnnotationToSomeLists(
                                    {
                                        annotationUrl: secondAnnotationUrl,
                                        localListIds: [DATA.LIST_2.id],
                                    },
                                )

                                await setup.backgroundModules.readwise.setAPIKey(
                                    {
                                        validatedKey: 'my key',
                                    },
                                )
                                await setup.backgroundModules.readwise.uploadAllAnnotations(
                                    {},
                                )

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
                                                            `.${DATA.TAG_1} .${
                                                                DATA.TAG_2
                                                            } .${
                                                                DATA.TAG_3
                                                            } .${formatReadwiseHighlightTag(
                                                                DATA.LIST_1
                                                                    .name,
                                                            )} .${formatReadwiseHighlightTag(
                                                                DATA.LIST_2
                                                                    .name,
                                                            )}\n` +
                                                            expectedHighlight1.note +
                                                            `\n#${DATA.TAG_1} #${DATA.TAG_2} #${DATA.TAG_3} [[${DATA.LIST_1.name}]] [[${DATA.LIST_2.name}]]`,
                                                    },
                                                    {
                                                        ...expectedHighlight2,
                                                        note:
                                                            `.${
                                                                DATA.TAG_2
                                                            } .${formatReadwiseHighlightTag(
                                                                DATA.LIST_2
                                                                    .name,
                                                            )}\n` +
                                                            expectedHighlight2.note +
                                                            `\n#${DATA.TAG_2} [[${DATA.LIST_2.name}]]`,
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
        // TODO: Fix this test
        backgroundIntegrationTest(
            'should sub tags with spaces in them for hyphens',
            () => {
                return
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

                                const testTagWithWhitespace =
                                    'test tag  with   whitespace'

                                const firstAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_1 },
                                    {
                                        ...DATA.ANNOT_1,
                                        title: DATA.ANNOT_1.pageTitle,
                                    },
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
                                        tag: testTagWithWhitespace,
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
                                await setup.backgroundModules.readwise.uploadAllAnnotations(
                                    {},
                                )

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
                                                    {
                                                        ...expectedHighlight1,
                                                        note:
                                                            `.${DATA.TAG_1} .${
                                                                DATA.TAG_2
                                                            } .${
                                                                DATA.TAG_3
                                                            } .${formatReadwiseHighlightTag(
                                                                testTagWithWhitespace,
                                                            )}\n` +
                                                            expectedHighlight1.note +
                                                            `\n#${DATA.TAG_1} #${DATA.TAG_2} #${DATA.TAG_3} [[${testTagWithWhitespace}]]`,
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
        // TODO: Fix this test
        backgroundIntegrationTest(
            'should sync existing annotations to Readwise',
            () => {
                return
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
                                    {
                                        ...DATA.ANNOT_1,
                                        title: DATA.ANNOT_1.pageTitle,
                                    },
                                )
                                const secondAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    {
                                        ...DATA.ANNOT_2,
                                        title: DATA.ANNOT_2.pageTitle,
                                    },
                                )
                                const thirdAnnotationUrl = await setup.backgroundModules.directLinking.createAnnotation(
                                    { tab: DATA.TEST_TAB_2 },
                                    {
                                        ...DATA.ANNOT_3,
                                        title: DATA.ANNOT_3.pageTitle,
                                    },
                                )

                                await setup.backgroundModules.readwise.uploadAllAnnotations(
                                    {},
                                )

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
                                                    DATA.UPLOADED_HIGHLIGHT_2(
                                                        secondAnnotationUrl,
                                                    ),
                                                    DATA.UPLOADED_HIGHLIGHT_3(
                                                        thirdAnnotationUrl,
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
    {
        startWithSyncDisabled: true,
    },
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
