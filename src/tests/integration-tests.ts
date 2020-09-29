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
import { ServerStorage } from 'src/storage/types'
import { Browser } from 'webextension-polyfill-ts'
import { MockFetchPageDataProcessor } from 'src/page-analysis/background/mock-fetch-page-data-processor'

export interface IntegrationTestSuite<StepContext> {
    description: string
    tests: Array<IntegrationTest<StepContext>>
}

export interface IntegrationTest<StepContext> {
    description: string
    mark?: boolean
    skipConflictTests?: boolean
    instantiate: (options: {
        isSyncTest?: boolean
    }) => IntegrationTestInstance<StepContext>
}
export interface IntegrationTestInstance<StepContext> {
    setup?: (options: StepContext) => Promise<void>
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
    browserAPIs: Browser
    fetchPageDataProcessor: MockFetchPageDataProcessor
    browserLocalStorage: MemoryBrowserStorage
    storageChangeDetector: StorageChangeDetector
    storageOperationLogger: StorageOperationLogger
    authService: MemoryAuthService
    subscriptionService: MemorySubscriptionsService
    getServerStorage(): Promise<ServerStorage>
}
export interface BackgroundIntegrationTestContext {
    setup: BackgroundIntegrationTestSetup
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
    skipConflictTests?: boolean
}
export function backgroundIntegrationTest(
    description: string,
    options: BackgroundIntegrationTestOptions,
    test: (options: {
        isSyncTest?: boolean
    }) => IntegrationTestInstance<BackgroundIntegrationTestContext>,
): BackgroundIntegrationTest
export function backgroundIntegrationTest(
    description: string,
    test: (options: {
        isSyncTest?: boolean
    }) => IntegrationTestInstance<BackgroundIntegrationTestContext>,
): BackgroundIntegrationTest
export function backgroundIntegrationTest(
    description: string,
    paramA:
        | BackgroundIntegrationTestOptions
        | ((options: {
              isSyncTest?: boolean
          }) => IntegrationTestInstance<BackgroundIntegrationTestContext>),
    paramB?: (options: {
        isSyncTest?: boolean
    }) => IntegrationTestInstance<BackgroundIntegrationTestContext>,
): BackgroundIntegrationTest {
    const test = typeof paramA === 'function' ? paramA : paramB
    const options = typeof paramA === 'object' ? paramA : {}
    return {
        description,
        skipConflictTests: options?.skipConflictTests,
        instantiate: test,
        ...options,
    }
}
