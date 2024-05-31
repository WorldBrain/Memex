import SQLite3 from 'better-sqlite3'
import StorageManager from '@worldbrain/storex'
import { createSQLiteStorageBackend } from '@worldbrain/storex-backend-sql/lib/sqlite'
import { generateSyncPatterns } from 'src/util/tests/sync-patterns'
import type {
    BackgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    BackgroundIntegrationTestInstance,
    BackgroundIntegrationTestOptions,
} from 'src/tests/integration-tests'
import {
    setupBackgroundIntegrationTest,
    BackgroundIntegrationTestSetupOpts,
} from 'src/tests/background-integration-tests'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { createTestServerStorage } from 'src/storage/server.tests'
import {
    PersonalCloudHub,
    StorexPersonalCloudBackend,
    StorexPersonalCloudMediaBackend,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/storex'
import {
    ChangeWatchMiddlewareSettings,
    ChangeWatchMiddleware,
    mergeChangeWatchSettings,
} from '@worldbrain/storex-middleware-change-watcher'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { createServices } from 'src/services'
import { PersonalDeviceType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import PersonalCloudStorage from '@worldbrain/memex-common/lib/personal-cloud/storage'
import { registerModuleCollections } from '@worldbrain/storex-pattern-modules'
import UserStorage from '@worldbrain/memex-common/lib/user-management/storage'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'
import { createAuthServices } from 'src/services/local-services'
import { MockPushMessagingService } from 'src/tests/push-messaging'
import { FakeFetch } from 'src/util/tests/fake-fetch'

export const BASE_TIMESTAMP = 555

const debug = (...args: any[]) => console['log'](...args, '\n\n\n')

type SyncTestSequence = SyncTestStep[]
interface SyncTestStep {
    action: 'execute' | 'sync' | 'preCheck' | 'postCheck'
    integrationStepIndex: number
    deviceIndex: number
}

export function registerSyncBackgroundIntegrationTests(
    test: BackgroundIntegrationTest,
    options?: BackgroundIntegrationTestSetupOpts,
) {
    describe('Sync tests', () => {
        registerSyncBackAndForthTests(test, options)
        if (!test.skipConflictTests) {
            registerConflictGenerationTests(test, options)
        }
    })
}

function maybeMark(s: string, mark: false | null | undefined | string): string {
    return mark ? s + mark : s
}

function registerSyncBackAndForthTests(
    test: BackgroundIntegrationTest,
    options?: BackgroundIntegrationTestSetupOpts,
) {
    const testOptions = test.instantiate({ isSyncTest: true })
    if (testOptions?.steps?.length > 0) {
        const syncPatterns = generateSyncPatterns(
            [0, 1],
            testOptions?.steps?.length ?? 0,
        )
        for (const pattern of syncPatterns) {
            const description = `${
                test.description
            } - 2 device sync back and forth - should work when synced in pattern ${getReadablePattern(
                pattern,
            )}`
            it(maybeMark(description, test.mark && '!!!'), async () => {
                const sequence = generateBackAndForthSyncTestSequence(pattern)
                await runSyncBackgroundTest({
                    test,
                    sequence,
                    deviceCount: 2,
                    ...options,
                })
            })
        }
    }
}

function generateBackAndForthSyncTestSequence(
    pattern: number[],
): SyncTestSequence {
    const sequence: SyncTestSequence = []
    let integrationStepIndex = -1
    for (const currentDeviceIndex of pattern) {
        integrationStepIndex += 1

        if (integrationStepIndex > 0) {
            sequence.push({
                action: 'sync',
                integrationStepIndex,
                deviceIndex: currentDeviceIndex,
            })
            sequence.push({
                action: 'postCheck',
                integrationStepIndex: integrationStepIndex - 1,
                deviceIndex: pattern[currentDeviceIndex],
            })
        }
        sequence.push({
            action: 'preCheck',
            integrationStepIndex,
            deviceIndex: currentDeviceIndex,
        })
        sequence.push({
            action: 'execute',
            integrationStepIndex,
            deviceIndex: currentDeviceIndex,
        })
        sequence.push({
            action: 'postCheck',
            integrationStepIndex,
            deviceIndex: currentDeviceIndex,
        })
        sequence.push({
            action: 'sync',
            integrationStepIndex,
            deviceIndex: currentDeviceIndex,
        })
    }

    const lastSyncedDeviceIndex = pattern[pattern.length - 1]
    const unsyncedDeviceIndex = lastSyncedDeviceIndex === 1 ? 0 : 1

    sequence.push({
        action: 'sync',
        integrationStepIndex: pattern.length - 1,
        deviceIndex: unsyncedDeviceIndex,
    })
    sequence.push({
        action: 'postCheck',
        integrationStepIndex: pattern.length - 1,
        deviceIndex: unsyncedDeviceIndex,
    })

    return sequence
}

function registerConflictGenerationTests(
    test: BackgroundIntegrationTest,
    options?: BackgroundIntegrationTestSetupOpts,
) {
    const description = `${test.description} - should work when device A syncs an action, device B does the same action, then syncs`
    it(maybeMark(description, test.mark && '!!!'), async () => {
        const testInstance = test.instantiate({ isSyncTest: true })
        const sequence = generateConfictingActionsTestSequence({ testInstance })
        await runSyncBackgroundTest({
            sequence,
            test,
            deviceCount: 2,
            ...options,
        })
    })
}

function generateConfictingActionsTestSequence(options: {
    testInstance: BackgroundIntegrationTestInstance
}): SyncTestSequence {
    const sequence: SyncTestSequence = []

    let integrationStepIndex = -1
    for (const step of options.testInstance.steps) {
        integrationStepIndex += 1

        sequence.push({
            action: 'preCheck',
            integrationStepIndex,
            deviceIndex: 0,
        })
        sequence.push({
            action: 'execute',
            integrationStepIndex,
            deviceIndex: 0,
        })
        // sequence.push({
        //     action: 'postCheck',
        //     integrationStepIndex,
        //     deviceIndex: 0,
        // })
        sequence.push({
            action: 'sync',
            integrationStepIndex,
            deviceIndex: 0,
        })
        sequence.push({
            action: 'execute',
            integrationStepIndex,
            deviceIndex: 1,
        })
        sequence.push({
            action: 'sync',
            integrationStepIndex,
            deviceIndex: 1,
        })
        // sequence.push({
        //     action: 'postCheck',
        //     integrationStepIndex,
        //     deviceIndex: 1,
        // })
        sequence.push({
            action: 'sync',
            integrationStepIndex,
            deviceIndex: 0,
        })
        // sequence.push({
        //     action: 'postCheck',
        //     integrationStepIndex,
        //     deviceIndex: 0,
        // })
    }
    return sequence
}

async function runSyncBackgroundTest(
    options: {
        sequence: SyncTestSequence
        test: BackgroundIntegrationTest
        deviceCount: number
    } & BackgroundIntegrationTestOptions &
        BackgroundIntegrationTestSetupOpts,
) {
    const testInstance = options.test.instantiate({ isSyncTest: true })
    const { setups, sync } = await setupSyncBackgroundTest({
        ...options,
        testInstance,
    })

    for (const setup of setups) {
        await testInstance.setup?.({ setup })
        await setup.backgroundModules.personalCloud.setup()
    }

    for (const sequenceStep of options.sequence) {
        const integrationTestStep =
            testInstance.steps[sequenceStep.integrationStepIndex]
        const setup = setups[sequenceStep.deviceIndex]
        // const deviceId = deviceIds[step.deviceIndex]
        const readableDeviceIndex = getReadableDeviceIndex(
            sequenceStep.deviceIndex,
        )

        if (testInstance.debug || integrationTestStep.debug) {
            debug(
                `SYNC TEST, action ${sequenceStep.action}, device ${readableDeviceIndex}`,
            )
        }

        if (sequenceStep.action === 'preCheck') {
            await integrationTestStep.preCheck?.({
                setup,
            })
        } else if (sequenceStep.action === 'postCheck') {
            await integrationTestStep.postCheck?.({
                setup,
            })
        } else if (sequenceStep.action === 'execute') {
            await integrationTestStep.execute({ setup })
        } else if (sequenceStep.action === 'sync') {
            await sync(sequenceStep.deviceIndex, {
                debug: integrationTestStep.debug,
            })
        }
    }
}

export async function setupSyncBackgroundTest(
    options: {
        deviceCount: number
        debugStorageOperations?: boolean
        superuser?: boolean
        serverChangeWatchSettings?: Array<
            Omit<ChangeWatchMiddlewareSettings, 'storageManager'>
        >
        sqlChangeWatchSettings?: Omit<
            ChangeWatchMiddlewareSettings,
            'storageManager'
        >
        useDownloadTranslationLayer?: boolean
        testInstance?: BackgroundIntegrationTestInstance
        enableFailsafes?: boolean
        fakeFetch?: FakeFetch
    } & BackgroundIntegrationTestOptions &
        BackgroundIntegrationTestSetupOpts,
) {
    const translationLayerTestBackend =
        process.env.TRANSLATION_LAYER_TEST_BACKEND

    const changeWatchSettings = !!translationLayerTestBackend
        ? options.serverChangeWatchSettings
        : (options.serverChangeWatchSettings ?? []).map((settings) =>
              mergeChangeWatchSettings([
                  settings,
                  options.sqlChangeWatchSettings,
              ]),
          )

    const serverStorage =
        (await options.testInstance?.getSetupOptions?.())?.serverStorage ??
        (await createTestServerStorage({
            setupMiddleware: (storageManager) =>
                changeWatchSettings.map(
                    (settings) =>
                        new ChangeWatchMiddleware({
                            ...settings,
                            storageManager,
                        }),
                ),
        }))
    const cloudHub = new PersonalCloudHub()

    let now = BASE_TIMESTAMP
    const getNow = () => now++
    const fetch = options.fakeFetch ?? new FakeFetch()
    const pushMessagingService = new MockPushMessagingService()
    const setups: BackgroundIntegrationTestSetup[] = []

    let getSqlStorageMananager: () => Promise<StorageManager> | undefined
    if (translationLayerTestBackend) {
        if (translationLayerTestBackend === 'sqlite') {
            const sqlite = SQLite3(':memory:', {
                // verbose: (...args) => console.log(...args)
            })
            const backend = createSQLiteStorageBackend(sqlite, {
                // debug: true,
            })
            const sqlStorageManager = new StorageManager({ backend })
            const userManagement = new UserStorage({
                storageManager: sqlStorageManager,
            })
            const personalCloudStorage = new PersonalCloudStorage({
                storageManager: sqlStorageManager,
                autoPkType: 'number',
            })
            sqlStorageManager.registry.registerCollection(
                'user',
                userManagement.collections.user,
            )
            // serverStorage.storageModules.personalCloud = personalCloudStorage
            registerModuleCollections(
                sqlStorageManager.registry,
                personalCloudStorage,
            )
            await sqlStorageManager.finishInitialization()

            const middleware: StorageMiddleware[] = []
            if (options.sqlChangeWatchSettings) {
                middleware.push(
                    new ChangeWatchMiddleware({
                        ...options.sqlChangeWatchSettings,
                        storageManager: sqlStorageManager,
                    }),
                )
            }
            sqlStorageManager.setMiddleware(middleware)
            getSqlStorageMananager = async () => sqlStorageManager
        } else {
            throw new Error(
                `Unknown TRANSLATION_LAYER_TEST_BACKEND: ${translationLayerTestBackend}`,
            )
        }
    }

    for (let i = 0; i < options.deviceCount; ++i) {
        const authServices = createAuthServices({
            backend: 'memory',
        })
        const services = createServices({
            backend: 'memory',
            serverStorage,
            authService: authServices.auth,
        })
        const getUserId = async () => {
            const currentUser = await authServices.auth.getCurrentUser()
            return currentUser?.id ?? null
        }
        const personalCloudBackend = new StorexPersonalCloudBackend({
            storageManager: serverStorage.manager,
            storageModules: serverStorage.modules,
            getSqlStorageMananager,
            clientSchemaVersion: STORAGE_VERSIONS[38].version,
            services: {
                activityStreams: services.activityStreams,
                pushMessaging: pushMessagingService,
            },
            getConfig: () => ({
                content_sharing: {
                    cloudflare_worker_credentials: 'test-creds',
                },
                deployment: { environment: 'staging' },
            }),
            captureException: async (err) => {
                console.warn(
                    'Got error in content sharing backend',
                    err.message,
                )
            },
            view: cloudHub.getView(),
            disableFailsafes: !options.enableFailsafes,
            getUserId,
            getNow,
            useDownloadTranslationLayer:
                options.useDownloadTranslationLayer ?? true,
            getDeviceId: async () =>
                (setup as BackgroundIntegrationTestSetup).backgroundModules
                    .personalCloud.deviceId,
            clientDeviceType: PersonalDeviceType.DesktopBrowser,
            fetch: fetch.fetch as any,
        })
        const personalCloudMediaBackend = new StorexPersonalCloudMediaBackend({
            getNow,
            getUserId,
            view: cloudHub.getView(),
            storageManager: serverStorage.manager,
        })

        const setup: BackgroundIntegrationTestSetup = await setupBackgroundIntegrationTest(
            {
                ...options,
                services,
                authServices,
                serverStorage,
                pushMessagingService,
                personalCloudBackend,
                personalCloudMediaBackend,
            },
        )
        setup.backgroundModules.personalCloud.actionQueue.forceQueueSkip = true
        setup.backgroundModules.personalCloud.strictErrorReporting = true
        setup.authService.setUser({ ...TEST_USER })
        await setup.backgroundModules.personalCloud.options.settingStore.set(
            'deviceId',
            i + 1,
        )
        setups.push(setup)
    }

    for (const setup of setups) {
        await setup.backgroundModules.personalCloud.setup()
        // setup.backgroundModules.personalCloud.actionQueue.forceQueueSkip = true

        if (!options.startWithSyncDisabled) {
            await setup.backgroundModules.personalCloud.enableSync()
            await setup.backgroundModules.personalCloud.startSync()
        }
    }

    const sync = async (
        deviceIndex: number,
        syncOptions: { debug: boolean },
    ) => {
        const setup = setups[deviceIndex]
        await setup.backgroundModules.personalCloud.integrateAllUpdates()
        await setup.backgroundModules.personalCloud.waitForSync()
    }

    return {
        setups,
        sync,
        serverStorage,
        getNow,
        getSqlStorageMananager,
    }
}

const getReadablePattern = (pattern: number[]) =>
    pattern.map(getReadableDeviceIndex).join('')

const getReadableDeviceIndex = (index: number) =>
    ({
        0: 'A',
        1: 'B',
        2: 'C',
    }[index])
