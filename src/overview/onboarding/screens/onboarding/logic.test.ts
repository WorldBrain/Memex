import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import {
    insertBackgroundFunctionTab,
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import Logic from './logic'

async function setupTest(
    { backgroundModules, authService, createElement }: UILogicTestDevice,
    args?: {
        isLoggedIn?: boolean
        onDashboardNav?: () => void
    },
) {
    if (args?.isLoggedIn) {
        await authService.loginWithEmailAndPassword(TEST_USER.email, 'password')
    }

    const _logic = new Logic({
        authBG: backgroundModules.auth.remoteFunctions,
        personalCloudBG: backgroundModules.personalCloud.remoteFunctions,
        navToDashboard: args?.onDashboardNav ?? (() => undefined),
        navToGuidedTutorial: () => undefined,
        contentScriptsBG: backgroundModules.contentScripts.remoteFunctions,
        bgScriptsBG: insertBackgroundFunctionTab(
            backgroundModules.bgScript.remoteFunctions,
        ) as any,
        browserAPIs: null,
        getRootElement: () => null,
        getWindow: () =>
            ({
                open: () => {},
                close: () => {},
            } as any),
    })

    const logic = createElement(_logic)

    return { logic, _logic }
}

describe('New install onboarding UI logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    // it('should show login first, unless user already logged in', async ({
    //     device,
    // }) => {
    //     const { logic: logicA, _logic: _logicA } = await setupTest(device, {
    //         isLoggedIn: false,
    //     })

    //     expect(logicA.state.shouldShowLogin).toBe(true)
    //     expect(logicA.state.loadState).toEqual('pristine')
    //     await logicA.init()
    //     expect(logicA.state.shouldShowLogin).toBe(true)
    //     expect(logicA.state.loadState).toEqual('success')

    //     const { logic: logicB, _logic: _logicB } = await setupTest(device, {
    //         isLoggedIn: true,
    //     })

    //     expect(logicB.state.shouldShowLogin).toBe(true)
    //     expect(logicB.state.loadState).toEqual('pristine')
    //     await logicB.init()
    //     expect(logicB.state.shouldShowLogin).toBe(false)
    //     expect(logicB.state.loadState).toEqual('success')

    //     await _logicA.syncPromise
    //     await _logicB.syncPromise
    // })

    // TODO: Fix this test
    it('should nav to dashboard upon finishing onboarding', async ({
        device,
    }) => {
        return
        let dashboardNavHappened = false
        const { logic } = await setupTest(device, {
            onDashboardNav: () => {
                dashboardNavHappened = true
            },
        })

        expect(dashboardNavHappened).toBe(false)
        await logic.processEvent('finishOnboarding', null)
        expect(dashboardNavHappened).toBe(true)
    })

    it('should enable sync and set local storage flag upon login', async ({
        device,
    }) => {
        const { logic } = await setupTest(device, { isLoggedIn: true })
        const { settingStore } = device.backgroundModules.personalCloud.options

        expect(await settingStore.get('isSetUp')).not.toBe(true)
        await logic.processEvent('onUserLogIn', { newSignUp: false })
        expect(await settingStore.get('isSetUp')).toBe(true)
    })

    // TODO: Fix this test
    it('should skip straight to dashboard on existing user re-run', async ({
        device,
    }) => {
        return
        let hasNavdToDashboard = false
        const { logic, _logic } = await setupTest(device, {
            isLoggedIn: true,
            onDashboardNav: () => {
                hasNavdToDashboard = true
            },
        })

        expect(hasNavdToDashboard).toBe(false)
        expect(_logic.isExistingUser).toBe(false)
        expect(_logic.syncPromise).toBeUndefined()
        expect(logic.state.shouldShowLogin).toBe(true)

        await logic.init()

        expect(hasNavdToDashboard).toBe(true)
        expect(_logic.isExistingUser).toBe(true)
        expect(_logic.syncPromise).not.toBeUndefined()
    })

    // TODO: Fix this test
    it('should enable sync and nav to dashboard on sync finish', async ({
        device,
    }) => {
        return
        let hasNavdToDashboard = false
        const { logic, _logic } = await setupTest(device, {
            isLoggedIn: false,
            onDashboardNav: () => {
                hasNavdToDashboard = true
            },
        })

        await logic.init()

        expect(hasNavdToDashboard).toBe(false)
        expect(_logic.isExistingUser).toBe(false)
        expect(_logic.syncPromise).toBeUndefined()
        expect(logic.state.syncState).toBe('pristine')
        expect(logic.state.shouldShowLogin).toBe(true)

        await device.backgroundModules.auth.authService.loginWithEmailAndPassword(
            TEST_USER.email,
            'password',
        )
        await logic.processEvent('onUserLogIn', { newSignUp: false })

        expect(hasNavdToDashboard).toBe(true)
        expect(_logic.syncPromise).not.toBeUndefined()
    })
})
