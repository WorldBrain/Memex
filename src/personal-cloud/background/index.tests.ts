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
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import { createLazyTestServerStorage } from 'src/storage/server'
import {
    PersonalCloudHub,
    StorexPersonalCloudBackend,
} from '@worldbrain/memex-common/lib/personal-cloud/backend/storex'
import type { ChangeWatchMiddlewareSettings } from '@worldbrain/storex-middleware-change-watcher'
import { STORAGE_VERSIONS } from 'src/storage/constants'
import { createServices } from 'src/services'
import { PersonalDeviceType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'

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
    const syncPatterns = generateSyncPatterns([0, 1], testOptions.steps.length)
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
        withTestUser?: boolean
        superuser?: boolean
        serverChangeWatchSettings?: Omit<
            ChangeWatchMiddlewareSettings,
            'storageManager'
        >
        useDownloadTranslationLayer?: boolean
        testInstance?: BackgroundIntegrationTestInstance
        enableFailsafes?: boolean
    } & BackgroundIntegrationTestOptions &
        BackgroundIntegrationTestSetupOpts,
) {
    const userId = TEST_USER.id

    const getServerStorage =
        options.testInstance?.getSetupOptions?.().getServerStorage ??
        createLazyTestServerStorage({
            changeWatchSettings: options.serverChangeWatchSettings,
        })
    const serverStorage = await getServerStorage()
    const cloudHub = new PersonalCloudHub()

    let now = BASE_TIMESTAMP
    const getNow = () => now++
    const setups: BackgroundIntegrationTestSetup[] = []
    for (let i = 0; i < options.deviceCount; ++i) {
        const services = await createServices({
            backend: 'memory',
            getServerStorage,
        })
        const personalCloudBackend = new StorexPersonalCloudBackend({
            storageManager: serverStorage.storageManager,
            storageModules: serverStorage.storageModules,
            clientSchemaVersion: STORAGE_VERSIONS[25].version,
            services,
            view: cloudHub.getView(),
            disableFailsafes: !options.enableFailsafes,
            getUserId: async () => userId,
            getNow,
            useDownloadTranslationLayer:
                options.useDownloadTranslationLayer ?? true,
            getDeviceId: async () =>
                (setup as BackgroundIntegrationTestSetup).backgroundModules
                    .personalCloud.deviceId,
            clientDeviceType: PersonalDeviceType.DesktopBrowser,
        })

        const setup: BackgroundIntegrationTestSetup = await setupBackgroundIntegrationTest(
            {
                ...options,
                services,
                getServerStorage,
                personalCloudBackend,
            },
        )
        setup.backgroundModules.personalCloud.actionQueue.forceQueueSkip = true
        setup.backgroundModules.personalCloud.strictErrorReporting = true

        const memoryAuth = setup.backgroundModules.auth
            .authService as MemoryAuthService
        await memoryAuth.setUser({ ...TEST_USER })
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

    return { userId, setups, sync, serverStorage, getNow }
}

const getReadablePattern = (pattern: number[]) =>
    pattern.map(getReadableDeviceIndex).join('')

const getReadableDeviceIndex = (index: number) =>
    ({
        0: 'A',
        1: 'B',
        2: 'C',
    }[index])
