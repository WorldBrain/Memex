import * as expect from 'expect'
import Logic from './logic'

describe('onboarding screen UI logic tests', () => {
    function setupTest() {
        const logic = new Logic()
        const state = logic.getInitialState()

        return { logic, state }
    }

    it('should be able to set current step', () => {
        const { logic, state } = setupTest()

        let nextState = state
        for (const step of [1, 2, 3, 4]) {
            expect(nextState.currentStep).not.toBe(step)
            nextState = logic.withMutation(
                nextState,
                logic.setStep({ event: { step }, previousState: nextState }),
            )
            expect(nextState.currentStep).toBe(step)
        }
    })

    it('should be able to set tooltip enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setTooltipEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.isTooltipEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setTooltipEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.isTooltipEnabled).toBe(false)
    })

    it('should be able to set sidebar enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setSidebarEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.isSidebarEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setSidebarEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.isSidebarEnabled).toBe(false)
    })

    it('should be able to set search settings shown state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setSearchSettingsShown({
                event: { shown: true },
                previousState: state,
            }),
        )
        expect(nextStateA.showSearchSettings).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setSearchSettingsShown({
                event: { shown: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.showSearchSettings).toBe(false)
    })
})
