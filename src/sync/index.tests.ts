import {
    doSync,
    SyncEvents,
    SYNC_EVENTS,
    SyncEventMap,
} from '@worldbrain/storex-sync'
import { reconcileSyncLog } from '@worldbrain/storex-sync/lib/reconciliation'
import { generateSyncPatterns } from 'src/util/tests/sync-patterns'
import {
    BackgroundIntegrationTest,
    BackgroundIntegrationTestSetup,
    IntegrationTestStep,
    BackgroundIntegrationTestContext,
} from 'src/tests/integration-tests'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { createMemorySharedSyncLog } from './background/index.tests'
import { StorageChangeDetector } from 'src/tests/storage-change-detector'
import { EventEmitter } from 'events'

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
    const syncEventEmitters: SyncEvents[] = []
    for (let i = 0; i < options.deviceCount; ++i) {
        setups.push(await setupBackgroundIntegrationTest({ sharedSyncLog }))

        const syncEventEmitter = new EventEmitter() as SyncEvents
        for (const eventName of Object.keys(SYNC_EVENTS)) {
            syncEventEmitter.on(eventName as keyof SyncEventMap, args => {
                console.log(
                    `SYNC EVENT ${eventName}:`,
                    require('util').inspect(args, {
                        colors: true,
                        depth: null,
                    }),
                )
            })
        }
        syncEventEmitters.push(syncEventEmitter)
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

    // const changeDetectors = setups.map(setup => new StorageChangeDetector({
    //     storageManager: setup.storageManager,
    //     toTrack: Object.keys(setup.storageManager.registry.collections),
    // }))
    // let changeDetectorUsed = false

    const sync = async (
        deviceIndex: number | string,
        syncOptions: { debug: boolean },
    ) => {
        const setup = setups[deviceIndex]
        await doSync({
            clientSyncLog: setup.backgroundModules.sync.clientSyncLog,
            sharedSyncLog,
            storageManager: setup.storageManager,
            reconciler: reconcileSyncLog,
            now: Date.now(),
            userId,
            deviceId: deviceIds[deviceIndex],
            syncEvents: syncEventEmitters[deviceIndex],
        })
    }

    const testOptions = await test.instantiate()

    let stepIndex = -1
    let lastStep: IntegrationTestStep<BackgroundIntegrationTestContext> = null
    for (const currentDeviceIndex of pattern) {
        stepIndex += 1
        const step = (lastStep = testOptions.steps[stepIndex])

        // const currentDeviceId = deviceIds[currentDeviceIndex]
        const currentSetup = setups[currentDeviceIndex]

        // console.log('stepIndex > 0', stepIndex)
        if (stepIndex > 0) {
            // console.log('pre-sync, device', currentDeviceId)
            await sync(currentDeviceIndex, { debug: step.debug })
        }

        // if (step.expectedStorageChanges && !changeDetectorUsed) {
        //     await Promise.all(changeDetectors.map(
        //         changeDetector => changeDetector.capture()
        //     ))
        //     changeDetectorUsed = true
        // }

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

        await sync(currentDeviceIndex, { debug: step.debug })
    }

    const lastSyncedDeviceIndex = pattern[pattern.length - 1]
    const unsyncedDeviceIndices = deviceIds
        .map((deviceId, deviceIndex) => deviceIndex)
        .filter(deviceIndex => deviceIndex !== lastSyncedDeviceIndex)

    for (const unsyncedDeviceIndex of unsyncedDeviceIndices) {
        await sync(unsyncedDeviceIndex, { debug: lastStep!.debug })
        await lastStep!.postCheck({ setup: setups[unsyncedDeviceIndex] })
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
