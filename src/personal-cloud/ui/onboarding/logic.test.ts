import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import {
    makeSingleDeviceUILogicTestFactory,
    insertBackgroundFunctionTab,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import Logic from './logic'
import type { State, Event } from './types'

async function setupTest(
    { backgroundModules, authService, createElement }: UILogicTestDevice,
    args?: {
        browser?: 'chrome' | 'firefox'
        isLoggedOut?: boolean
        isSyncDisabled?: boolean
        onModalClose?: (args?: { didFinish?: boolean }) => void
    },
) {
    if (!args?.isLoggedOut) {
        await authService.loginWithEmailAndPassword(TEST_USER.email, 'password')
    }

    if (!args?.isSyncDisabled) {
        await backgroundModules.personalCloud.enableSync()
    }

    const _logic = new Logic({
        browser: args?.browser ?? 'chrome',
        backupBG: insertBackgroundFunctionTab(
            backgroundModules.backupModule.remoteFunctions,
        ) as any,
        personalCloudBG: backgroundModules.personalCloud.remoteFunctions,
        syncSettingsBG: backgroundModules.syncSettings.remoteFunctions,
        onModalClose: args?.onModalClose ?? (() => undefined),
    })

    const logic = createElement<State, Event>(_logic)

    return { _logic, logic }
}

describe('Cloud onboarding UI logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()
    // TODO: Fix this test
    it(
        'should set local storage flag upon data migration',
        async ({ device }) => {
            const { logic } = await setupTest(device, { isSyncDisabled: true })
            const {
                settingStore,
            } = device.backgroundModules.personalCloud.options

            logic.processMutation({ needsToRemovePassiveData: { $set: false } })

            expect(logic.state.stage).toEqual('data-dump')
            expect(await settingStore.get('isSetUp')).not.toBe(true)
            expect(logic.state.isMigrationPrepped).toBe(false)

            await logic.processEvent('continueToMigration', null)

            expect(logic.state.stage).toEqual('data-migration')
            expect(logic.state.isMigrationPrepped).toBe(true)
            expect(await settingStore.get('isSetUp')).toBe(true)
        },
        { shouldSkip: true },
    )

    // TODO: Fix this test

    it(
        'should set finished flag on modal close handler, upon final modal close',
        async ({ device }) => {
            let didFinish = false
            const { logic } = await setupTest(device, {
                isSyncDisabled: true,
                onModalClose: (args) => {
                    didFinish = !!args?.didFinish
                },
            })

            logic.processMutation({ needsToRemovePassiveData: { $set: false } })

            expect(logic.state.isMigrationPrepped).toBe(false)
            await logic.processEvent('continueToMigration', null)
            expect(logic.state.isMigrationPrepped).toBe(true)

            expect(didFinish).toBe(false)
            await logic.processEvent('closeMigration', null)
            expect(didFinish).toBe(true)
        },
        { shouldSkip: true },
    )

    it('should disable DB backup change recording before performing passive data wipe', async ({
        device,
    }) => {
        let recordingChanges = true
        device.backgroundModules.backupModule.remoteFunctions.disableRecordingChanges = async () => {
            recordingChanges = false
        }
        const { logic } = await setupTest(device)

        expect(recordingChanges).toBe(true)
        await logic.processEvent('startDataClean', null)
        expect(recordingChanges).toBe(false)
    })

    // NOTE: dump was disabled at last minute due to concerns with non-constant space usage leading to crashes (on browser that supports the new API)
    // it('should determine whether dump is needed, based on last backup time existence', async ({
    //     device,
    // }) => {
    //     device.backgroundModules.backupModule.remoteFunctions.getBackupTimes = async () => ({
    //         lastBackup: null, // As there isn't a last backup time, it should tell user to dump
    //         nextBackup: null,
    //     })
    //     const { logic: logicA } = await setupTest(device)
    //     expect(logicA.state.shouldBackupViaDump).toBe(false)
    //     await logicA.init()
    //     expect(logicA.state.shouldBackupViaDump).toBe(true)

    //     device.backgroundModules.backupModule.remoteFunctions.getBackupTimes = async () => ({
    //         lastBackup: Date.now(), // As there now is a last backup time, it shouldn't tell user to dump
    //         nextBackup: null,
    //     })
    //     const { logic: logicB } = await setupTest(device)
    //     expect(logicB.state.shouldBackupViaDump).toBe(false)
    //     await logicB.init()
    //     expect(logicB.state.shouldBackupViaDump).toBe(false)
    // })

    it('should not ask user to dump if using firefox', async ({ device }) => {
        device.backgroundModules.backupModule.remoteFunctions.getBackupTimes = async () => ({
            lastBackup: null, // As there isn't a last backup time, it should tell user to dump
            nextBackup: null,
        })
        const { logic: logicA } = await setupTest(device, {
            browser: 'firefox',
        })
        expect(logicA.state.shouldBackupViaDump).toBe(false)
        await logicA.init()
        expect(logicA.state.shouldBackupViaDump).toBe(false)

        device.backgroundModules.backupModule.remoteFunctions.getBackupTimes = async () => ({
            lastBackup: Date.now(), // As there now is a last backup time, it shouldn't tell user to dump
            nextBackup: null,
        })
        const { logic: logicB } = await setupTest(device, {
            browser: 'firefox',
        })
        expect(logicB.state.shouldBackupViaDump).toBe(false)
        await logicB.init()
        expect(logicB.state.shouldBackupViaDump).toBe(false)
    })

    it('should determine whether passive data removal is needed, based on whether data exists from earlier than 2020-09-09', async ({
        device,
    }) => {
        const {
            localExtSettingStore,
        } = device.backgroundModules.personalCloud.options

        await localExtSettingStore.set('installTimestamp', Date.now())

        const { logic: logicA } = await setupTest(device)
        expect(logicA.state.needsToRemovePassiveData).toBe(false)
        await logicA.init()
        expect(logicA.state.needsToRemovePassiveData).toBe(false)

        expect(logicA.state.stage).toEqual('data-dump')
        await logicA.processEvent('continueToMigration', null)
        expect(logicA.state.stage).toEqual('data-migration')

        // Try again, this time with old install time
        await localExtSettingStore.set(
            'installTimestamp',
            new Date('2018-01-01').getTime(),
        )

        const { logic: logicB } = await setupTest(device)
        expect(logicB.state.needsToRemovePassiveData).toBe(false)
        await logicB.init()
        expect(logicB.state.needsToRemovePassiveData).toBe(true)

        expect(logicB.state.stage).toEqual('data-dump')
        await logicB.processEvent('continueToMigration', null)
        expect(logicB.state.stage).toEqual('data-clean')
    })
})
