import type StorageManager from '@worldbrain/storex'
import type { BackgroundModules } from 'src/background-script/setup'
import type {
    StorageCollectionDiff,
    StorageChangeDetector,
} from './storage-change-detector'
import StorageOperationLogger, {
    LoggedStorageOperation,
} from './storage-operation-logger'
import {
    registerBackgroundIntegrationTest,
    BackgroundIntegrationTestSetupOpts,
} from './background-integration-tests'
import type MemoryBrowserStorage from 'src/util/tests/browser-storage'
import type { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import type { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import type { ServerStorage } from 'src/storage/types'
import type { Browser } from 'webextension-polyfill'
import type fetchMock from 'fetch-mock'
import type { Services } from 'src/services/types'
import type { MockPushMessagingService } from './push-messaging'

export interface IntegrationTestSuite<StepContext> {
    description: string
    tests: Array<IntegrationTest<StepContext>>
}

export interface IntegrationTest<StepContext>
    extends BackgroundIntegrationTestOptions {
    description: string
    instantiate: (options: {
        isSyncTest?: boolean
    }) => IntegrationTestInstance<StepContext>
}
export interface IntegrationTestInstance<StepContext> {
    getSetupOptions?(): Promise<BackgroundIntegrationTestSetupOpts>
    setup?: (options: StepContext) => Promise<void>
    debug?: boolean
    steps: Array<IntegrationTestStep<StepContext>>
}

export interface IntegrationTestStep<StepContext> {
    debug?: true
    description?: string
    preCheck?: (context: StepContext) => Promise<void>
    execute: (context: StepContext) => Promise<void>
    postCheck?: (context: StepContext) => Promise<void>

    validateStorageChanges?: (context: {
        changes: {
            [collection: string]: StorageCollectionDiff
        }
    }) => void
    expectedStorageChanges?: {
        [collection: string]: () => StorageCollectionDiff
    }
    expectedStorageOperations?: () => LoggedStorageOperation[]
    expectedSyncLogEntries?: () => any[]
}

export interface BackgroundIntegrationTestSetup {
    storageManager: StorageManager
    getSqlStorageMananager?(): Promise<StorageManager>
    persistentStorageManager: StorageManager
    backgroundModules: BackgroundModules
    browserAPIs: Browser
    windowAPI: Window
    services: Services
    browserLocalStorage: MemoryBrowserStorage
    storageChangeDetector: StorageChangeDetector
    storageOperationLogger: StorageOperationLogger
    pushMessagingService: MockPushMessagingService
    authService: MemoryAuthService
    subscriptionService: MemorySubscriptionsService
    serverStorage: ServerStorage
    injectTime: (getNow: () => number) => void
    injectCallFirebaseFunction: (
        f: <Returns>(name: string, ...args: any[]) => Promise<Returns>,
    ) => void
    fetch: fetchMock.FetchMockSandbox
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
    options?: BackgroundIntegrationTestSetupOpts,
): IntegrationTestSuite<BackgroundIntegrationTestContext> {
    describe(description, () => {
        for (const integrationTest of tests) {
            registerBackgroundIntegrationTest(integrationTest, options)
        }
    })
    return { description, tests }
}

export interface BackgroundIntegrationTestOptions {
    mark?: boolean
    skipSyncTests?: boolean
    skipConflictTests?: boolean
    customTestOpts?: BackgroundIntegrationTestSetupOpts
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
