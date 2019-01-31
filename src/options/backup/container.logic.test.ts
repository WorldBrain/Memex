import * as expect from 'expect'
import { fakeRemoteFunction } from 'src/util/webextensionRPC'
import * as logic from 'src/options/backup/container.logic'
import { MemoryLocalStorage } from 'src/util/tests/local-storage'
import { FakeAnalytics } from 'src/analytics'

function setupTest() {
    const localStorage = new MemoryLocalStorage()
    const analytics = new FakeAnalytics()
    const triggerEvent = async (state, event, { remoteFunctions }) => {
        const result = await logic.processEvent({
            state,
            localStorage,
            analytics,
            event,
            remoteFunction: fakeRemoteFunction(remoteFunctions),
        })
        if (result.screen) {
            Object.assign(state, result)
        }
        return result
    }
    return { localStorage, analytics, triggerEvent }
}

describe('Backup settings container logic', () => {
    it('should be able to guide the user through the onboarding flow', async () => {
        const { localStorage, analytics, triggerEvent } = setupTest()

        const firstSessionState = await logic.getInitialState({
            analytics,
            localStorage,
            remoteFunction: fakeRemoteFunction({
                isBackupAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
            }),
        })
        expect(firstSessionState).toEqual({
            isAuthenticated: false,
            screen: 'overview',
        })

        await triggerEvent(
            firstSessionState,
            { type: 'onBackupRequested' },
            {
                remoteFunctions: {
                    isBackupAuthenticated: () => false,
                    hasInitialBackup: () => false,
                    getBackupInfo: () => null,
                },
            },
        )
        expect(localStorage.popChanges()).toEqual([
            { type: 'set', key: 'backup.onboarding', value: true },
        ])
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'Backup',
                    action: 'onboarding-triggered',
                },
                force: true,
            },
        ])

        // User chooses backup location
        await triggerEvent(
            firstSessionState,
            { type: 'onChoice' },
            {
                remoteFunctions: {
                    isAutomaticBackupEnabled: () => false,
                },
            },
        )
        expect(firstSessionState).toEqual({
            isAuthenticated: false,
            screen: 'onboarding-how',
        })
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'Backup',
                    action: 'onboarding-where-chosen',
                },
                force: true,
            },
        ])

        // User chooses manual backup
        await triggerEvent(
            firstSessionState,
            { type: 'onChoice', choice: { type: 'manual' } },
            {
                remoteFunctions: {
                    isAutomaticBackupEnabled: () => false,
                },
            },
        )
        expect(firstSessionState).toEqual({
            isAuthenticated: false,
            screen: 'onboarding-size',
        })
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'Backup',
                    action: 'onboarding-how-chosen',
                    value: { type: 'manual' },
                },
                force: true,
            },
        ])

        // User tries to log in
        const loginResult = await logic.processEvent({
            state: firstSessionState,
            localStorage,
            analytics,
            event: { type: 'onLoginRequested' },
            remoteFunction: fakeRemoteFunction({
                isAutomaticBackupEnabled: () => false,
            }),
        })
        expect(loginResult).toEqual({
            redirect: { to: 'gdrive-login' },
        })
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'Backup',
                    action: 'onboarding-login-requested',
                },
                force: true,
            },
        ])
        expect(localStorage.popChanges()).toEqual([
            {
                type: 'set',
                key: 'backup.onboarding.authenticating',
                value: true,
            },
        ])

        // User lands back on the backup settings page after logging in
        const secondSessionState = await logic.getInitialState({
            analytics,
            localStorage,
            remoteFunction: fakeRemoteFunction({
                isBackupAuthenticated: () => true,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
            }),
        })
        expect(secondSessionState).toEqual({
            isAuthenticated: true,
            screen: 'running-backup',
        })
        expect(localStorage.popChanges()).toEqual([
            { type: 'remove', key: 'backup.onboarding.payment' },
            { type: 'remove', key: 'backup.onboarding.authenticating' },
            { type: 'remove', key: 'backup.onboarding' },
        ])

        // Backup finished, return to overview
        await triggerEvent(
            secondSessionState,
            { type: 'onFinish' },
            {
                remoteFunctions: {
                    isAutomaticBackupEnabled: () => false,
                },
            },
        )

        expect(secondSessionState).toEqual({
            isAuthenticated: true,
            screen: 'overview',
        })
    })

    it('should be able to guide the user through the restore flow when they try to restore without being logged in', async () => {
        const { localStorage, analytics, triggerEvent } = setupTest()

        const firstSessionState = await logic.getInitialState({
            analytics,
            localStorage,
            remoteFunction: fakeRemoteFunction({
                isBackupAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
            }),
        })
        expect(firstSessionState).toEqual({
            isAuthenticated: false,
            screen: 'overview',
        })

        await triggerEvent(
            firstSessionState,
            { type: 'onRestoreRequested' },
            { remoteFunctions: {} },
        )
        expect(firstSessionState).toEqual({
            isAuthenticated: false,
            screen: 'restore-where',
        })

        const choiceResult = await triggerEvent(
            firstSessionState,
            { type: 'onChoice' },
            {
                remoteFunctions: {
                    isBackupAuthenticated: () => false,
                },
            },
        )
        expect(choiceResult).toEqual({
            redirect: { to: 'gdrive-login' },
        })
        expect(localStorage.popChanges()).toEqual([
            {
                type: 'set',
                key: 'backup.restore.authenticating',
                value: true,
            },
        ])

        const secondSessionState = await logic.getInitialState({
            analytics,
            localStorage,
            remoteFunction: fakeRemoteFunction({
                isBackupAuthenticated: () => true,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
            }),
        })
        expect(secondSessionState).toEqual({
            isAuthenticated: true,
            screen: 'restore-running',
        })
        expect(localStorage.popChanges()).toEqual([
            {
                type: 'remove',
                key: 'backup.restore.authenticating',
            },
        ])
    })

    it('should be able to handle a Drive login cancel during restore flow', async () => {
        const { localStorage, analytics, triggerEvent } = setupTest()

        const firstSessionState = await logic.getInitialState({
            analytics,
            localStorage,
            remoteFunction: fakeRemoteFunction({
                isBackupAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
            }),
        })
        expect(firstSessionState).toEqual({
            isAuthenticated: false,
            screen: 'overview',
        })

        await triggerEvent(
            firstSessionState,
            { type: 'onRestoreRequested' },
            { remoteFunctions: {} },
        )
        expect(firstSessionState).toEqual({
            isAuthenticated: false,
            screen: 'restore-where',
        })

        const choiceResult = await triggerEvent(
            firstSessionState,
            { type: 'onChoice' },
            {
                remoteFunctions: {
                    isBackupAuthenticated: () => false,
                },
            },
        )
        expect(choiceResult).toEqual({
            redirect: { to: 'gdrive-login' },
        })
        expect(localStorage.popChanges()).toEqual([
            {
                type: 'set',
                key: 'backup.restore.authenticating',
                value: true,
            },
        ])

        const secondSessionState = await logic.getInitialState({
            analytics,
            localStorage,
            remoteFunction: fakeRemoteFunction({
                isBackupAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
            }),
        })
        expect(secondSessionState).toEqual({
            isAuthenticated: false,
            screen: 'restore-where',
        })
        expect(localStorage.popChanges()).toEqual([
            {
                type: 'remove',
                key: 'backup.restore.authenticating',
            },
        ])
    })

    it('should be able to guide the user through the restore flow when they try to restore while being logged in', async () => {
        const { localStorage, analytics, triggerEvent } = setupTest()

        const firstSessionState = await logic.getInitialState({
            analytics,
            localStorage,
            remoteFunction: fakeRemoteFunction({
                isBackupAuthenticated: () => true,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
            }),
        })
        expect(firstSessionState).toEqual({
            isAuthenticated: true,
            screen: 'overview',
        })

        await triggerEvent(
            firstSessionState,
            { type: 'onRestoreRequested' },
            { remoteFunctions: {} },
        )
        expect(firstSessionState).toEqual({
            isAuthenticated: true,
            screen: 'restore-where',
        })

        await triggerEvent(
            firstSessionState,
            { type: 'onChoice' },
            {
                remoteFunctions: {},
            },
        )
        expect(firstSessionState).toEqual({
            isAuthenticated: true,
            screen: 'restore-running',
        })
    })
})

describe('Backup settings container logic helpers', () => {
    describe('getScreenStateProps()', () => {
        it('should return the corrent state props', () => {
            expect(
                logic.getScreenProps({
                    state: {
                        foo: 5,
                    },
                    screenConfig: {
                        component: null,
                        state: { foo: true },
                        events: {},
                    },
                }),
            )
        })
    })

    describe('getScreenHandlers()', () => {
        it('should correctly dispatch state changes without an argument', async () => {
            const calls = []
            const handlers = logic.getScreenHandlers({
                state: {},
                screenConfig: {
                    component: null,
                    state: {},
                    events: { bla: true },
                },
                dependencies: {
                    localStorage: 'localStorage',
                    remoteFunction: 'remoteFunction' as any,
                    analytics: 'analytics',
                },
                eventProcessor: async args => {
                    calls.push({ type: 'process', args })
                    return { screen: 'bla', redirect: null }
                },
                onStateChange: args => calls.push({ type: 'state', args }),
                onRedirect: args => calls.push({ type: 'redirect', args }),
            })
            await handlers['bla']()
            expect(calls).toEqual([
                {
                    type: 'process',
                    args: {
                        state: {},
                        event: { type: 'bla' },
                        localStorage: 'localStorage',
                        remoteFunction: 'remoteFunction',
                        analytics: 'analytics',
                    },
                },
                { type: 'state', args: { screen: 'bla' } },
            ])
        })

        it('should correctly dispatch state changes with an argument', async () => {
            const calls = []
            const handlers = logic.getScreenHandlers({
                state: {},
                screenConfig: {
                    component: null,
                    state: {},
                    events: { bla: { argument: 'arg' } },
                },
                dependencies: {
                    localStorage: 'localStorage',
                    remoteFunction: 'remoteFunction' as any,
                    analytics: 'analytics',
                },
                eventProcessor: async args => {
                    calls.push({ type: 'process', args })
                    return { screen: 'bla', redirect: null }
                },
                onStateChange: args => calls.push({ type: 'state', args }),
                onRedirect: args => calls.push({ type: 'redirect', args }),
            })
            await handlers['bla']('foo')
            expect(calls).toEqual([
                {
                    type: 'process',
                    args: {
                        state: {},
                        event: { type: 'bla', arg: 'foo' },
                        localStorage: 'localStorage',
                        remoteFunction: 'remoteFunction',
                        analytics: 'analytics',
                    },
                },
                { type: 'state', args: { screen: 'bla' } },
            ])
        })
    })
})
