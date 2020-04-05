import StorageManager from '@worldbrain/storex'
import { BackgroundModules } from 'src/background-script/setup'
import {
    StorageDiff,
    StorageCollectionDiff,
    StorageChangeDetector,
} from './storage-change-detector'
import StorageOperationLogger, {
    LoggedStorageOperation,
} from './storage-operation-logger'
import { registerBackgroundIntegrationTest } from './background-integration-tests'
import MemoryBrowserStorage from 'src/util/tests/browser-storage'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'

export interface IntegrationTestSuite<StepContext> {
    description: string
    tests: Array<IntegrationTest<StepContext>>
}

export interface IntegrationTest<StepContext> {
    description: string
    mark?: boolean
    instantiate: () => IntegrationTestInstance<StepContext>
}
export interface IntegrationTestInstance<StepContext> {
    steps: Array<IntegrationTestStep<StepContext>>
}

export interface IntegrationTestStep<StepContext> {
    debug?: true
    description?: string
    preCheck?: (context: StepContext) => Promise<void>
    execute: (context: StepContext) => Promise<void>
    postCheck?: (context: StepContext) => Promise<void>

    expectedStorageChanges?: {
        [collection: string]: () => StorageCollectionDiff
    }
    expectedStorageOperations?: () => LoggedStorageOperation[]
    expectedSyncLogEntries?: () => any[]
}

export interface BackgroundIntegrationTestSetup {
    storageManager: StorageManager
    backgroundModules: BackgroundModules
    browserLocalStorage: MemoryBrowserStorage
    storageChangeDetector: StorageChangeDetector
    storageOperationLogger: StorageOperationLogger
    authService: MemoryAuthService
    subscriptionService: MemorySubscriptionsService
}
export interface BackgroundIntegrationTestContext {
    setup: BackgroundIntegrationTestSetup
    isSyncTest?: boolean
}
export type BackgroundIntegrationTest = IntegrationTest<
    BackgroundIntegrationTestContext
>
export type BackgroundIntegrationTestInstance = IntegrationTestInstance<
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

export interface BackgroundIntegrationTestOptions {
    mark?: boolean
}
export function backgroundIntegrationTest(
    description: string,
    options: BackgroundIntegrationTestOptions,
    test: () => IntegrationTestInstance<BackgroundIntegrationTestContext>,
): BackgroundIntegrationTest
export function backgroundIntegrationTest(
    description: string,
    test: () => IntegrationTestInstance<BackgroundIntegrationTestContext>,
): BackgroundIntegrationTest
export function backgroundIntegrationTest(
    description: string,
    paramA:
        | BackgroundIntegrationTestOptions
        | (() => IntegrationTestInstance<BackgroundIntegrationTestContext>),
    paramB?: () => IntegrationTestInstance<BackgroundIntegrationTestContext>,
): BackgroundIntegrationTest {
    const test = typeof paramA === 'function' ? paramA : paramB
    const options = typeof paramA === 'object' ? paramA : {}
    return {
        description,
        instantiate: test,
        ...options,
    }
}
