import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import {
    makeSingleDeviceUILogicTestFactory,
    insertBackgroundFunctionTab,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import { createUIServices } from 'src/services/ui'
import Logic from './logic'
import type { State, Event } from './types'

async function setupText(
    { backgroundModules, services, createElement }: UILogicTestDevice,
    args?: { isLoggedOut?: boolean; onModalClose?: () => void },
) {
    if (!args?.isLoggedOut) {
        await services.auth.loginWithEmailAndPassword(
            TEST_USER.email,
            'password',
        )
    }

    const _logic = new Logic({
        services: createUIServices(),
        authBG: backgroundModules.auth.remoteFunctions,
        backupBG: insertBackgroundFunctionTab(
            backgroundModules.backupModule.remoteFunctions,
        ) as any,
        onModalClose: args?.onModalClose ?? (() => undefined),
    })

    const logic = createElement<State, Event>(_logic)

    return { _logic, logic }
}

describe('Cloud onboarding UI logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should determine whether dump is needed based on last backup time existence', async ({
        device,
    }) => {
        device.backgroundModules.backupModule.remoteFunctions.getBackupTimes = async () => ({
            lastBackup: null, // As there isn't a last backup time, it should tell user to dump
            nextBackup: null,
        })
        const { logic: logicA } = await setupText(device)
        expect(logicA.state.shouldBackupViaDump).toBe(false)
        await logicA.init()
        expect(logicA.state.shouldBackupViaDump).toBe(true)

        device.backgroundModules.backupModule.remoteFunctions.getBackupTimes = async () => ({
            lastBackup: Date.now(), // As there now is a last backup time, it shouldn't tell user to dump
            nextBackup: null,
        })
        const { logic: logicB } = await setupText(device)
        expect(logicB.state.shouldBackupViaDump).toBe(false)
        await logicB.init()
        expect(logicB.state.shouldBackupViaDump).toBe(false)
    })
})
