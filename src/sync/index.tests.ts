import { doSync } from '@worldbrain/storex-sync'
import { reconcileSyncLog } from '@worldbrain/storex-sync/lib/reconciliation'
import { generateSyncPatterns } from 'src/util/tests/sync-patterns'
import { IntegrationTestInstance } from 'src/tests/integration-tests'

// describe('Sync integration tests', () => {
//     // const it = makeTestFactory()

//     function integrationTest(
//         description: string,
//         test: () => IntegrationTestInstance<TestContext>,
//     ) {
//         describe(description, () => {
//             it('should work when synced in various patterns across 2 devices', async () => {
//                 const userId = 'user'

//                 const testOptions = await test()
//                 const syncPatterns = generateSyncPatterns(
//                     [0, 1],
//                     testOptions.steps.length,
//                 )
//                 for (const pattern of syncPatterns) {
//                     const getReadablePattern = () =>
//                         pattern.map(idx => (idx === 0 ? 'A' : 'B')).join('')

//                     const setups = [await setupTest(), await setupTest()]

//                     const sharedSyncLog = await setupSharedSyncLog()
//                     const deviceIds = [
//                         await sharedSyncLog.createDeviceId({
//                             userId,
//                             sharedUntil: 0,
//                         }),
//                         await sharedSyncLog.createDeviceId({
//                             userId,
//                             sharedUntil: 0,
//                         }),
//                     ]

//                     const sync = async (
//                         setup: TestSetup,
//                         deviceId: number | string,
//                     ) => {
//                         try {
//                             await doSync({
//                                 clientSyncLog: setup.clientSyncLog,
//                                 sharedSyncLog,
//                                 storageManager: setup.storageManager,
//                                 reconciler: reconcileSyncLog,
//                                 now: '$now',
//                                 userId,
//                                 deviceId,
//                             })
//                         } catch (e) {
//                             console.error(
//                                 `ERROR: Sync failed for test '${description}', pattern '${getReadablePattern()}', step ${stepIndex}`,
//                             )
//                             throw e
//                         }
//                     }

//                     let stepIndex = -1
//                     for (const currentDeviceIndex of pattern) {
//                         stepIndex += 1
//                         const currentDeviceId = deviceIds[currentDeviceIndex]
//                         const currentSetup = setups[currentDeviceIndex]

//                         if (stepIndex > 0) {
//                             await sync(currentSetup, currentDeviceId)
//                         }

//                         const step = testOptions.steps[stepIndex]
//                         if (step.preCheck) {
//                             await step.preCheck({
//                                 setup: currentSetup,
//                             })
//                         }
//                         await step.execute({
//                             setup: currentSetup,
//                         })
//                         if (step.preCheck) {
//                             await step.postCheck({
//                                 setup: currentSetup,
//                             })
//                         }
//                         await sync(currentSetup, currentDeviceId)
//                     }

//                     const lastSyncedDeviceIndex = pattern[pattern.length - 1]
//                     const unsyncedDeviceIndex = (lastSyncedDeviceIndex + 1) % 2

//                     await sync(
//                         setups[unsyncedDeviceIndex],
//                         deviceIds[unsyncedDeviceIndex],
//                     )
//                 }
//             })
//         })
//     }
// })
