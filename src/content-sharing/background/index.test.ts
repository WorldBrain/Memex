import expect from 'expect'

import {
    backgroundIntegrationTestSuite,
    backgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'

export const INTEGRATION_TESTS = backgroundIntegrationTestSuite(
    'Content sharing',
    [
        backgroundIntegrationTest('should xXxXxXx', () => {
            return {
                steps: [
                    {
                        execute: async ({ setup }) => {},
                        expectedStorageChanges: {},
                        preCheck: async ({ setup }) => {},
                        postCheck: async ({ setup }) => {},
                    },
                ],
            }
        }),
    ],
)
