import { generateSyncPatterns } from 'src/util/tests/sync-patterns'
import {
    BackgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    BackgroundIntegrationTestInstance,
} from 'src/tests/integration-tests'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { createMemorySharedSyncLog } from './background/index.tests'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'

// to shut up linting
const debug = console['log'].bind(console)

type SyncTestSequence = SyncTestStep[]
interface SyncTestStep {
    action: 'execute' | 'sync' | 'preCheck' | 'postCheck'
    integrationStepIndex: number
    deviceIndex: number
}

export function registerSyncBackgroundIntegrationTests(
    test: BackgroundIntegrationTest,
) {
    describe('Sync tests', () => {
        describe('should work when synced in various patterns across 2 devices', () => {
            registerSyncBackAndForthTests(test)
        })
        describe('should work when doing the same action on two devices, then syncing', () => {
            registerConflictGenerationTests(test)
        })
    })
}

function maybeMark(s: string, mark: false | null | undefined | string): string {
    return mark ? s + mark : s
}

function registerSyncBackAndForthTests(test: BackgroundIntegrationTest) {
    const testOptions = test.instantiate()
    const syncPatterns = generateSyncPatterns([0, 1], testOptions.steps.length)
    for (const pattern of syncPatterns) {
        const description = `should work when synced in pattern ${getReadablePattern(
            pattern,
        )}`
        it(maybeMark(description, test.mark && '!!!'), async () => {
            const sequence = generateBackAndForthSyncTestSequence(pattern)
            await runSyncBackgroundTest({
                test,
                sequence,
                deviceCount: 2,
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

function registerConflictGenerationTests(test: BackgroundIntegrationTest) {
    const description =
        'should work when device A syncs an action, device B does the same action, then syncs'
    it(maybeMark(description, test.mark && '!!!'), async () => {
        const testInstance = test.instantiate()
        const sequence = generateConfictingActionsTestSequence({ testInstance })
        await runSyncBackgroundTest({
            sequence,
            test,
            deviceCount: 2,
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

async function runSyncBackgroundTest(options: {
    sequence: SyncTestSequence
    test: BackgroundIntegrationTest
    deviceCount: number

    // setups: BackgroundIntegrationTestSetup[]
    // deviceIds: Array<number | string>
    // sync: (
    //     deviceIndex: number | string,
    //     syncOptions: { debug: boolean },
    // ) => Promise<void>
}) {
    const { setups, sync } = await setupSyncBackgroundTest({
        deviceCount: options.deviceCount,
    })

    const testInstance = await options.test.instantiate()
    for (const sequenceStep of options.sequence) {
        const integrationTestStep =
            testInstance.steps[sequenceStep.integrationStepIndex]
        const setup = setups[sequenceStep.deviceIndex]
        // const deviceId = deviceIds[step.deviceIndex]
        const readableDeviceIndex = getReadableDeviceIndex(
            sequenceStep.deviceIndex,
        )

        if (integrationTestStep.debug) {
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
            if (integrationTestStep.expectedStorageOperations) {
                setup.storageOperationLogger.enabled = true
            }
            const timeBeforeStepExecution = Date.now()
            await integrationTestStep.execute({ setup })

            setup.storageOperationLogger.enabled = false
            if (integrationTestStep.expectedStorageOperations) {
                const executedOperations = setup.storageOperationLogger.popOperations()
                expect(
                    executedOperations.filter(
                        entry => entry.operation[1] !== 'clientSyncLogEntry',
                    ),
                ).toEqual(integrationTestStep.expectedStorageOperations())
            }

            if (integrationTestStep.expectedSyncLogEntries) {
                const addedEntries = await setup.backgroundModules.sync.clientSyncLog.getEntriesCreatedAfter(
                    timeBeforeStepExecution,
                )
                expect(addedEntries).toEqual(
                    integrationTestStep.expectedSyncLogEntries(),
                )
            }
        } else if (sequenceStep.action === 'sync') {
            await sync(sequenceStep.deviceIndex, {
                debug: integrationTestStep.debug,
            })
        }
    }
}

async function setupSyncBackgroundTest(options: {
    deviceCount: number
    debugStorageOperations?: boolean
}) {
    const userId = 'user'

    const sharedSyncLog = await createMemorySharedSyncLog()
    const setups: BackgroundIntegrationTestSetup[] = []
    for (let i = 0; i < options.deviceCount; ++i) {
        setups.push(await setupBackgroundIntegrationTest({ sharedSyncLog }))
    }

    // const deviceIds: Array<number | string> = []

    for (const setup of setups) {
        // const deviceId = await sharedSyncLog.createDeviceId({
        //     userId,
        //     sharedUntil: 0,
        // })
        // deviceIds.push(deviceId)

        const memoryAuth = setup.backgroundModules.auth
            .authService as MemoryAuthService
        memoryAuth.setUser({ ...TEST_USER, id: userId })
        await setup.backgroundModules.sync.continuousSync.initDevice()
        await setup.backgroundModules.sync.continuousSync.enableContinuousSync()
    }

    // const changeDetectors = setups.map(setup => new StorageChangeDetector({
    //     storageManager: setup.storageManager,
    //     toTrack: Object.keys(setup.storageManager.registry.collections),
    // }))
    // let changeDetectorUsed = false

    const sync = async (
        deviceIndex: number,
        syncOptions: { debug: boolean },
    ) => {
        const setup = setups[deviceIndex]
        await setup.backgroundModules.sync.continuousSync.doIncrementalSync({
            debug: syncOptions.debug,
            prettifier: object =>
                require('util').inspect(object, {
                    depth: null,
                    color: true,
                    indent: 4,
                }),
        })
    }

    return { userId, setups, sync }
}

const getReadablePattern = (pattern: number[]) =>
    pattern.map(getReadableDeviceIndex).join('')

const getReadableDeviceIndex = (index: number) =>
    ({
        0: 'A',
        1: 'B',
        2: 'C',
    }[index])
