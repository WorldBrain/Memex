import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from '../../logic.test.util'

describe('Dashboard sync menu logic', () => {
    const it = makeSingleDeviceUILogicTestFactory({
        // includePostSyncProcessor: true,
    })
    // TODO: Fix this test
    it(
        'should be able to set display state',
        async ({ device }) => {
            const { searchResults } = await setupTest(device)

            expect(searchResults.state.syncMenu.isDisplayed).toBe(false)
            await searchResults.processEvent('setSyncStatusMenuDisplayState', {
                isShown: false,
            })
            expect(searchResults.state.syncMenu.isDisplayed).toBe(true)
            await searchResults.processEvent('setSyncStatusMenuDisplayState', {
                isShown: true,
            })
            expect(searchResults.state.syncMenu.isDisplayed).toBe(false)
        },
        { shouldSkip: true },
    )
    // TODO: Fix this test
    it(
        'should set last synced date based of sync last seen value',
        async ({ device }) => {
            const testTime = Date.now()
            await device.backgroundModules.personalCloud.options.settingStore.set(
                'lastSeen',
                testTime,
            )
            const { searchResults } = await setupTest(device)

            expect(
                searchResults.state.syncMenu.lastSuccessfulSyncDate,
            ).toBeNull()
            await searchResults.init()
            expect(
                searchResults.state.syncMenu.lastSuccessfulSyncDate,
            ).not.toBeNull()
            expect(
                searchResults.state.syncMenu.lastSuccessfulSyncDate.getTime(),
            ).toEqual(testTime)
            await searchResults.cleanup()
        },
        { shouldSkip: true },
    )
    // TODO: Fix this test
    it(
        'should be able to set unsynced item count display states',
        async ({ device }) => {
            const { searchResults } = await setupTest(device)

            expect(
                searchResults.state.syncMenu.pendingLocalChangeCount,
            ).toEqual(0)
            expect(
                searchResults.state.syncMenu.pendingRemoteChangeCount,
            ).toEqual(0)

            await searchResults.processEvent('setPendingChangeCounts', {
                remote: 10,
            })

            expect(
                searchResults.state.syncMenu.pendingLocalChangeCount,
            ).toEqual(0)
            expect(
                searchResults.state.syncMenu.pendingRemoteChangeCount,
            ).toEqual(10)

            await searchResults.processEvent('setPendingChangeCounts', {
                local: 15,
            })

            expect(
                searchResults.state.syncMenu.pendingRemoteChangeCount,
            ).toEqual(10)
            expect(
                searchResults.state.syncMenu.pendingLocalChangeCount,
            ).toEqual(15)

            await searchResults.processEvent('setPendingChangeCounts', {
                local: 1,
                remote: 1,
            })

            expect(
                searchResults.state.syncMenu.pendingRemoteChangeCount,
            ).toEqual(1)
            expect(
                searchResults.state.syncMenu.pendingLocalChangeCount,
            ).toEqual(1)
        },
        { shouldSkip: true },
    )

    // TODO: Fix this test

    it(
        'should set unsynced item count display states on remote event emission',
        async ({ device }) => {
            const { searchResults } = await setupTest(device)

            await searchResults.init()

            expect(
                searchResults.state.syncMenu.pendingLocalChangeCount,
            ).toEqual(0)
            expect(
                searchResults.state.syncMenu.pendingRemoteChangeCount,
            ).toEqual(0)

            await device.backgroundModules.personalCloud.options.remoteEventEmitter.emit(
                'cloudStatsUpdated',
                { stats: { pendingDownloads: 5, pendingUploads: 8 } },
            )

            expect(
                searchResults.state.syncMenu.pendingLocalChangeCount,
            ).toEqual(8)
            // TODO: re-implement pending download count
            // expect(searchResults.state.syncMenu.pendingRemoteChangeCount).toEqual(5)

            await device.backgroundModules.personalCloud.options.remoteEventEmitter.emit(
                'cloudStatsUpdated',
                { stats: { pendingDownloads: 54, pendingUploads: 18 } },
            )

            expect(
                searchResults.state.syncMenu.pendingLocalChangeCount,
            ).toEqual(18)
            // expect(searchResults.state.syncMenu.pendingRemoteChangeCount).toEqual(
            //     54,
            // )

            await searchResults.cleanup()
        },
        { shouldSkip: true },
    )
})
