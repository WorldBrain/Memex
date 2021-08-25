import { TEST_USER } from '@worldbrain/memex-common/lib/authentication/dev'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import Logic from './logic'

async function setupTest(
    { backgroundModules, services, createElement }: UILogicTestDevice,
    args?: {
        isLoggedIn?: boolean
        onDashboardNav?: () => void
    },
) {
    if (args?.isLoggedIn) {
        await services.auth.loginWithEmailAndPassword(
            TEST_USER.email,
            'password',
        )
    }

    const _logic = new Logic({
        authBG: backgroundModules.auth.remoteFunctions,
        personalCloudBG: backgroundModules.personalCloud.remoteFunctions,
        navToDashboard: args?.onDashboardNav ?? (() => undefined),
    })

    const logic = createElement(_logic)

    return { logic, _logic }
}

describe('New install onboarding UI logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should show login first, unless user already logged in', async ({
        device,
    }) => {
        const { logic: logicA } = await setupTest(device, { isLoggedIn: false })

        expect(logicA.state.shouldShowLogin).toBe(true)
        expect(logicA.state.loadState).toEqual('pristine')
        await logicA.init()
        expect(logicA.state.shouldShowLogin).toBe(true)
        expect(logicA.state.loadState).toEqual('success')

        const { logic: logicB } = await setupTest(device, { isLoggedIn: true })

        expect(logicB.state.shouldShowLogin).toBe(true)
        expect(logicB.state.loadState).toEqual('pristine')
        await logicB.init()
        expect(logicB.state.shouldShowLogin).toBe(false)
        expect(logicB.state.loadState).toEqual('success')
    })

    it('should start sync upon login', async ({ device }) => {
        const { logic, _logic } = await setupTest(device)

        expect(logic.state.syncState).toEqual('pristine')
        expect(logic.state.shouldShowLogin).toBe(true)
        await logic.processEvent('onUserLogIn', null)
        expect(logic.state.shouldShowLogin).toBe(false)

        expect(logic.state.syncState).toEqual('running')
        await _logic.syncPromise
        expect(logic.state.syncState).toEqual('success')
    })

    it('should nav to dashboard upon finishing onboarding', async ({
        device,
    }) => {
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
})
