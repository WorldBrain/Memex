import StorageManager from '@worldbrain/storex'
import { BackgroundModules } from 'src/background-script/setup'
import { StorageDiff, StorageCollectionDiff } from './storage-change-detector'
import { LoggedStorageOperation } from './storage-operation-logger'
import { registerBackgroundIntegrationTest } from './background-integration-tests'
import MemoryBrowserStorage from 'src/util/tests/browser-storage'

export interface IntegrationTestSuite<StepContext> {
    description: string
    tests: Array<IntegrationTest<StepContext>>
}

export interface IntegrationTest<StepContext> {
    description: string
    instantiate: () => IntegrationTestInstance<StepContext>
}
export interface IntegrationTestInstance<StepContext> {
    steps: Array<IntegrationTestStep<StepContext>>
}

export interface IntegrationTestStep<StepContext> {
    description?: string
    preCheck?: (context: StepContext) => Promise<void>
    execute: (context: StepContext) => Promise<void>
    postCheck?: (context: StepContext) => Promise<void>

    expectedStorageChanges?: {
        [collection: string]: () => StorageCollectionDiff
    }
    expectedStorageOperations?: () => LoggedStorageOperation[]
}

export interface BackgroundIntegrationTestSetup {
    storageManager: StorageManager
    backgroundModules: BackgroundModules
    browserLocalStorage: MemoryBrowserStorage
}
export interface BackgroundIntegrationTestContext {
    setup: BackgroundIntegrationTestSetup
}
export type BackgroundIntegrationTest = IntegrationTest<
    BackgroundIntegrationTestContext
>
export type BackgroundIntegrationTestSuite = IntegrationTestSuite<
    BackgroundIntegrationTestContext
>

export function backgroundIntegrationTestSuite(
    description: string,
    tests: Array<IntegrationTest<BackgroundIntegrationTestContext>>,
): IntegrationTestSuite<BackgroundIntegrationTestContext> {
    describe(description, () => {
        for (const integrationTest of tests) {
            registerBackgroundIntegrationTest(integrationTest)
        }
    })
    return { description, tests }
}

export function backgroundIntegrationTest(
    description: string,
    test: () => IntegrationTestInstance<BackgroundIntegrationTestContext>,
): BackgroundIntegrationTest {
    return {
        description,
        instantiate: test,
    }
}
