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

const readwiseIntegration = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.readwise
const directLinking = (setup: BackgroundIntegrationTestSetup) =>
    setup.backgroundModules.directLinking

let annotUrl!: string
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
                    steps: [createAPIKeyStep],
                }
            },
        ),
        backgroundIntegrationTest(
            'should validate the api key, save it in local storage, then test it exists on object',
            () => {
                return {
                    steps: [createAPIKeyStep],
                }
            },
        ),
        backgroundIntegrationTest(
            'should validate the api key, save it in local storage, create an annotation, and post it to readwise',
            () => {
                return {
                    steps: [
                        createAPIKeyStep,
                        {
                            execute: async ({ setup }) => {
                                annotUrl = await directLinking(
                                    setup,
                                ).createAnnotation(
                                    { tab: {} as any },
                                    DATA.ANNOT_1 as any,
                                    { skipPageIndexing: true },
                                )
                            },
                            postCheck: async ({ setup }) => {
                                const mostRecentResponse = readwiseIntegration(
                                    setup,
                                ).mostRecentResponse
                                expect(mostRecentResponse).toEqual({
                                    title: DATA.ANNOT_1.title,
                                    highlights_url: DATA.ANNOT_1.url,
                                })
                            },
                        },
                    ],
                }
            },
        ),
        backgroundIntegrationTest(
            'should validate the api key, save it in local storage, modify an annotation, and post it to readwise',
            () => {
                return {
                    steps: [
                        createAPIKeyStep,
                        {
                            execute: async ({ setup }) => {
                                annotUrl = await directLinking(
                                    setup,
                                ).editAnnotation(
                                    { tab: {} as any },
                                    DATA.ANNOT_1 as any,
                                    { skipPageIndexing: true },
                                )
                            },
                            postCheck: async ({ setup }) => {
                                const mostRecentResponse = readwiseIntegration(
                                    setup,
                                ).mostRecentResponse
                                expect(mostRecentResponse).toEqual({
                                    title: DATA.ANNOT_1.title,
                                    highlights_url: DATA.ANNOT_1.url,
                                })
                            },
                        },
                    ],
                }
            },
        ),

        backgroundIntegrationTest(
            'should validate the api key, save it in local storage, modify an annotation, post it to readwise, and receive an error',
            () => {
                return {
                    steps: [
                        createAPIKeyStep,
                        {
                            execute: async ({ setup }) => {
                                annotUrl = await directLinking(
                                    setup,
                                ).createAnnotation(
                                    { tab: {} as any },
                                    DATA.ANNOT_1 as any,
                                    { skipPageIndexing: true },
                                )
                            },
                            postCheck: async ({ setup }) => {
                                const mostRecentResponse = readwiseIntegration(
                                    setup,
                                ).mostRecentResponse
                                expect(mostRecentResponse).toEqual({
                                    status: expect.any(Number),
                                    body: {
                                        message: expect.any(String),
                                    },
                                })
                                expect(mostRecentResponse.status).not.toEqual(
                                    200,
                                )
                            },
                        },
                    ],
                }
            },
        ),
    ],
)
