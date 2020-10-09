import expect from 'expect'

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

                                const createdHighlights: Array<ReadwiseHighlight> = []
                                setup.backgroundModules.readwise.readwiseAPI.putHighlight = async (
                                    params,
                                ) => {
                                    expect(params.key).toEqual('my key')
                                    createdHighlights.push(params.highlight)
                                    return { success: true }
                                }

                                await setup.backgroundModules.directLinking.createAnnotation(
                                    {
                                        tab: {
                                            url: DATA.PAGE_1.fullUrl,
                                        } as any,
                                    },
                                    DATA.ANNOT_1 as any,
                                    { skipPageIndexing: true },
                                )
                                await setup.backgroundModules.directLinking.createAnnotation(
                                    {
                                        tab: {
                                            url: DATA.PAGE_2.fullUrl,
                                        } as any,
                                    },
                                    DATA.ANNOT_2 as any,
                                    { skipPageIndexing: true },
                                )
                                expect(createdHighlights).toEqual([{}, {}])
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
