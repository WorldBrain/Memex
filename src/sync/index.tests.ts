import { doSync } from '@worldbrain/storex-sync'
import { reconcileSyncLog } from '@worldbrain/storex-sync/lib/reconciliation'
import { generateSyncPatterns } from 'src/util/tests/sync-patterns'
import {
    BackgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
} from 'src/tests/integration-tests'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { createMemorySharedSyncLog } from './background/index.tests'

export function registerSyncBackgroundIntegrationTests(
    test: BackgroundIntegrationTest,
) {
    describe('sync tests', () => {
        describe('should work when synced in various patterns across 2 devices', () => {
            const testOptions = test.instantiate()
            const syncPatterns = generateSyncPatterns(
                [0, 1],
                testOptions.steps.length,
            )
            for (const pattern of syncPatterns) {
                it(`should work when synced in pattern ${getReadablePattern(
                    pattern,
                )}`, async () => {
                    await runSyncBackgroundTest(test, {
                        pattern,
                        deviceCount: 2,
                    })
                })
            }
        })
        // describe('should work when synced in various patterns across 3 devices', () => {
        //     const testOptions = test.instantiate()
        //     const syncPatterns = generateSyncPatterns(
        //         [0, 1, 2],
        //         testOptions.steps.length,
        //     )
        //     for (const pattern of syncPatterns) {
        //         it(`should work when synced in pattern ${getReadablePattern(pattern)}`, async () => {
        //             await runSyncBackgroundTest(test, { pattern, deviceCount: 3 })
        //         })
        //     }
        // })
    })
}

async function runSyncBackgroundTest(
    test: BackgroundIntegrationTest,
    options: {
        pattern: number[]
        deviceCount: number
    },
) {
    const { pattern } = options
    const userId = 'user'

    const sharedSyncLog = await createMemorySharedSyncLog()
    const setups: BackgroundIntegrationTestSetup[] = []
    for (let i = 0; i < options.deviceCount; ++i) {
        setups.push(await setupBackgroundIntegrationTest({ sharedSyncLog }))
    }
    for (const setup of setups) {
        setup.backgroundModules.sync.syncLoggingMiddleware.enabled = true
    }

    const deviceIds = [
        await sharedSyncLog.createDeviceId({
            userId,
            sharedUntil: 0,
        }),
        await sharedSyncLog.createDeviceId({
            userId,
            sharedUntil: 0,
        }),
    ]

    const sync = async (
        setup: BackgroundIntegrationTestSetup,
        deviceId: number | string,
    ) => {
        await doSync({
            clientSyncLog: setup.backgroundModules.sync.clientSyncLog,
            sharedSyncLog,
            storageManager: setup.storageManager,
            reconciler: reconcileSyncLog,
            now: Date.now(),
            userId,
            deviceId,
        })
    }

    const testOptions = await test.instantiate()

    let stepIndex = -1
    for (const currentDeviceIndex of pattern) {
        stepIndex += 1
        const currentDeviceId = deviceIds[currentDeviceIndex]
        const currentSetup = setups[currentDeviceIndex]

        // console.log('stepIndex > 0', stepIndex)
        if (stepIndex > 0) {
            // console.log('pre-sync, device', currentDeviceId)
            await sync(currentSetup, currentDeviceId)
        }

        const step = testOptions.steps[stepIndex]
        if (step.preCheck) {
            await step.preCheck({
                setup: currentSetup,
            })
        }
        await step.execute({
            setup: currentSetup,
        })
        if (step.postCheck) {
            await step.postCheck({
                setup: currentSetup,
            })
        }

        // console.log('post-sync, device', currentDeviceId)
        await sync(currentSetup, currentDeviceId)

        // const lastSyncedDeviceIndex = pattern[pattern.length - 1]
        // const unsyncedDeviceIndex = (lastSyncedDeviceIndex + 1) % 2

        // await sync(
        //     setups[unsyncedDeviceIndex],
        //     deviceIds[unsyncedDeviceIndex],
        // )
    }
}

const getReadablePattern = (pattern: number[]) =>
    pattern
        .map(
            idx =>
                ({
                    0: 'A',
                    1: 'B',
                    2: 'C',
                }[idx]),
        )
        .join('')
