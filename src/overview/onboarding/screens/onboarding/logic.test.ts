import expect from 'expect'
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

    it('should be able to set visit delay', () => {
        const { logic, state } = setupTest()

        let nextState = state
        for (const delay of [1, 2, 3, 4, 5, 6]) {
            expect(nextState.visitDelay).not.toBe(delay)
            nextState = logic.withMutation(
                nextState,
                logic.setVisitDelay({
                    event: { delay },
                    previousState: nextState,
                }),
            )
            expect(nextState.visitDelay).toBe(delay)
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

    it('should be able to set keyboard shortcuts enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setShortcutsEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.areShortcutsEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setShortcutsEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.areShortcutsEnabled).toBe(false)
    })

    it('should be able to set index page stubs enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setStubsEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.areStubsEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setStubsEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.areStubsEnabled).toBe(false)
    })

    it('should be able to set index page visits enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setVisitsEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.areVisitsEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setVisitsEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.areVisitsEnabled).toBe(false)
    })

    it('should be able to set index page bookmarks enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setBookmarksEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.areBookmarksEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setBookmarksEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.areBookmarksEnabled).toBe(false)
    })

    it('should be able to set index page annotations enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setAnnotationsEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.areAnnotationsEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setAnnotationsEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.areAnnotationsEnabled).toBe(false)
    })

    it('should be able to set index page screenshots enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setScreenshotsEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.areScreenshotsEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setScreenshotsEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.areScreenshotsEnabled).toBe(false)
    })

    it('should be able to set index page collections enabled state', () => {
        const { logic, state } = setupTest()

        const nextStateA = logic.withMutation(
            state,
            logic.setCollectionsEnabled({
                event: { enabled: true },
                previousState: state,
            }),
        )
        expect(nextStateA.areCollectionsEnabled).toBe(true)
        const nextStateB = logic.withMutation(
            nextStateA,
            logic.setCollectionsEnabled({
                event: { enabled: false },
                previousState: nextStateA,
            }),
        )
        expect(nextStateB.areCollectionsEnabled).toBe(false)
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
