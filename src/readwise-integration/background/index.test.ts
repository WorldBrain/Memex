import expect from 'expect'
import update from 'immutability-helper'

import * as DATA from 'src/readwise-integration/background/index.test.data'
import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    IntegrationTestStep,
    BackgroundIntegrationTestContext,
} from 'src/tests/integration-tests'
import { StorageCollectionDiff } from 'src/tests/storage-change-detector'
import { ReadwiseHighlight } from './types'
import { injectFakeTabs } from 'src/tab-management/background/index.tests'
import { READWISE_API_URL } from './constants'
import { string } from 'prop-types'

const readwiseIntegration = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.readwise
const directLinking = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.directLinking

let API_KEY: string = 'DUMMYVALUE'

const createAPIKeyStep: IntegrationTestStep<BackgroundIntegrationTestContext> = {
    execute: async ({ setup }) => {
        await readwiseIntegration(setup).setAPIKey(API_KEY)
    },
    expectedStorageChanges: {
        readwiseAPIKey: (): StorageCollectionDiff => ({
            [API_KEY]: {
                type: 'create',
                object: {
                    key: API_KEY,
                },
            },
        }),
    },
    postCheck: async ({ setup }) => {
        expect(await readwiseIntegration(setup).getAPIKey()).toEqual(API_KEY)
    },
}

// const createAnnotationStep: IntegrationTestStep<BackgroundIntegrationTestContext> = {
//     ,
//   expectedStorageChanges: {
//       readwiseAnnotation: (): StorageCollectionDiff => ({
//           [annotUrl]: {
//               type: 'create',
//               object: {
//                   localId: DATA.READWISE_ANNOT_1.localId
//               },
//           },
//       }),
//   },
// }

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
        backgroundIntegrationTest(
            'should instantiate ReadwiseBackground, run ReadwiseBackground.setup, and find key',
            () => {
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
            },
        ),
        backgroundIntegrationTest(
            'should store and retrieve the api key',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.readwise.setAPIKey(
                                    'my key',
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
        backgroundIntegrationTest(
            'should store and retrieve the api key',
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                let validatedKey: string
                                setup.backgroundModules.readwise.validateAPIKey = async (
                                    key,
                                ) => {
                                    validatedKey = key
                                    return { success: true }
                                }
                                expect(
                                    await setup.backgroundModules.readwise.validateAPIKey(
                                        'good key',
                                    ),
                                ).toEqual({ success: true })
                                expect(validatedKey).toEqual('good key')

                                setup.backgroundModules.readwise.validateAPIKey = async (
                                    key,
                                ) => {
                                    validatedKey = key
                                    return { success: false }
                                }
                                expect(
                                    await setup.backgroundModules.readwise.validateAPIKey(
                                        'bad key',
                                    ),
                                ).toEqual({ success: false })
                                expect(validatedKey).toEqual('bad key')
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should upload highlights to readwise when creating annotations',
            { skipConflictTests: true },
            () => {
                return {
                    steps: [
                        {
                            execute: async ({ setup }) => {
                                await setup.backgroundModules.readwise.setAPIKey(
                                    'my key',
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
                                expect(
                                    setup.fetch.calls().map((call) =>
                                        update(call, {
                                            1: {
                                                body: {
                                                    $apply: (body) =>
                                                        JSON.parse(
                                                            body as string,
                                                        ),
                                                },
                                            },
                                        }),
                                    ),
                                ).toEqual([
                                    [
                                        READWISE_API_URL,
                                        {
                                            method: 'POST',
                                            headers: {
                                                Authorization: 'Token my key',
                                                'Content-Type':
                                                    'application/json',
                                            },
                                            body: {
                                                highlights: [
                                                    {
                                                        text: DATA.ANNOT_1.body,
                                                        title:
                                                            DATA.TEST_TAB_1
                                                                .title,
                                                        source_url:
                                                            DATA.PAGE_1.fullUrl,
                                                        source_type: 'article',
                                                        note:
                                                            DATA.ANNOT_1
                                                                .comment,
                                                        location_type:
                                                            'time_offset',
                                                        highlighted_at: DATA.ANNOT_1.createdWhen.toISOString(),
                                                        highlight_url: firstAnnotationUrl,
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    [
                                        READWISE_API_URL,
                                        {
                                            method: 'POST',
                                            headers: {
                                                Authorization: 'Token my key',
                                                'Content-Type':
                                                    'application/json',
                                            },
                                            body: {
                                                highlights: [
                                                    {
                                                        text: DATA.ANNOT_2.body,
                                                        title:
                                                            DATA.TEST_TAB_2
                                                                .title,
                                                        source_url:
                                                            DATA.PAGE_2.fullUrl,
                                                        source_type: 'article',
                                                        note:
                                                            DATA.ANNOT_2
                                                                .comment,
                                                        location_type:
                                                            'time_offset',
                                                        highlighted_at: DATA.ANNOT_1.createdWhen.toISOString(),
                                                        highlight_url: secondAnnotationUrl,
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                ])
                            },
                        },
                    ],
                }
            },
        ),
        // backgroundIntegrationTest(
        //     'should validate the api key, save it in local storage, modify an annotation, and post it to readwise',
        //     () => {
        //         return {
        //             steps: [
        //                 createAPIKeyStep,
        //                 {
        //                     execute: async ({ setup }) => {
        //                         annotUrl = await directLinking(
        //                             setup,
        //                         ).editAnnotation(
        //                             { tab: {} as any },
        //                             DATA.ANNOT_1 as any,
        //                             { skipPageIndexing: true },
        //                         )
        //                     },
        //                     postCheck: async ({ setup }) => {
        //                         const mostRecentResponse = readwiseIntegration(
        //                             setup,
        //                         ).mostRecentResponse
        //                         expect(mostRecentResponse).toEqual({
        //                             title: DATA.ANNOT_1.title,
        //                             highlights_url: DATA.ANNOT_1.url,
        //                         })
        //                     },
        //                 },
        //             ],
        //         }
        //     },
        // ),

        // backgroundIntegrationTest(
        //     'should validate the api key, save it in local storage, modify an annotation, post it to readwise, and receive an error',
        //     () => {
        //         return {
        //             steps: [
        //                 createAPIKeyStep,
        //                 {
        //                     execute: async ({ setup }) => {
        //                         annotUrl = await directLinking(
        //                             setup,
        //                         ).createAnnotation(
        //                             { tab: {} as any },
        //                             DATA.ANNOT_1 as any,
        //                             { skipPageIndexing: true },
        //                         )
        //                     },
        //                     postCheck: async ({ setup }) => {
        //                         const mostRecentResponse = readwiseIntegration(
        //                             setup,
        //                         ).mostRecentResponse
        //                         expect(mostRecentResponse).toEqual({
        //                             status: expect.any(Number),
        //                             body: {
        //                                 message: expect.any(String),
        //                             },
        //                         })
        //                         expect(mostRecentResponse.status).not.toEqual(
        //                             200,
        //                         )
        //                     },
        //                 },
        //             ],
        //         }
        //     },
        // ),
    ],
)
