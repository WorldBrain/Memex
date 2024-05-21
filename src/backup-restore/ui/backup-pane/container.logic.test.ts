import expect from 'expect'
import { fakeRemoteFunctions } from 'src/util/webextensionRPC'
import * as logic from 'src/backup-restore/ui/backup-pane/container.logic'
import { FakeAnalytics } from 'src/analytics/mock'
import { BrowserSettingsStore } from 'src/util/settings'
import MemoryBrowserStorage from 'src/util/tests/browser-storage'
import { LocalBackupSettings } from 'src/backup-restore/background/types'

function setupTest() {
    const localBackupSettings = new BrowserSettingsStore<LocalBackupSettings>(
        new MemoryBrowserStorage(),
        { prefix: 'localBackup.' },
    )
    const analytics = new FakeAnalytics()
    const triggerEvent = async (state, event, { remoteFunctions }) => {
        const result = await logic.processEvent({
            localBackupSettings,
            state,
            analytics,
            event,
            remoteFunction: fakeRemoteFunctions(remoteFunctions),
        })
        if (result.screen) {
            Object.assign(state, result)
        }
        return result
    }
    return { localBackupSettings, analytics, triggerEvent }
}

describe('Backup settings container logic', () => {
    // TODO: Fix this test
    it.skip('should be able to guide the user through the onboarding flow', async () => {
        return
        const { localBackupSettings, analytics, triggerEvent } = setupTest()

        const firstSessionState = await logic.getInitialState({
            analytics,
            localBackupSettings,
            remoteFunction: fakeRemoteFunctions({
                isBackupBackendAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
                getBackendLocation: () => undefined,
                enableAutomaticBackup: () => undefined,
            }),
        })
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'overview',
            }),
        )

        await triggerEvent(
            firstSessionState,
            { type: 'onBackupRequested' },
            {
                remoteFunctions: {
                    isBackupBackendAuthenticated: () => false,
                    hasInitialBackup: () => false,
                    getBackupInfo: () => null,
                    getBackendLocation: () => undefined,
                    setBackendLocation: (choice) => undefined,
                    enableAutomaticBackup: () => undefined,
                },
            },
        )
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'onboarding-where',
            }),
        )
        expect(await localBackupSettings.get('isOnboarding')).toEqual(true)
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'Backup',
                    action: 'onboarding-triggered',
                },
            },
        ])

        // User chooses backup location
        let backendLocation: string
        await triggerEvent(
            firstSessionState,
            { type: 'onChoice', choice: 'google-drive' },
            {
                remoteFunctions: {
                    isAutomaticBackupEnabled: () => false,
                    setBackendLocation: (newChoice) =>
                        (backendLocation = newChoice),
                    enableAutomaticBackup: () => undefined,
                },
            },
        )
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'running-backup',
            }),
        )
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'Backup',
                    action: 'onboarding-where-chosen',
                },
            },
        ])
        expect(backendLocation).toEqual('local')

        // // User chooses manual backup
        // await triggerEvent(
        //     firstSessionState,
        //     { type: 'onChoice', choice: { type: 'manual' } },
        //     {
        //         remoteFunctions: {
        //             isAutomaticBackupEnabled: () => false,
        //             enableAutomaticBackup: () => undefined,
        //         },
        //     },
        // )
        // expect(firstSessionState).toEqual(
        //     expect.objectContaining({
        //         isAuthenticated: false,
        //         screen: 'onboarding-size',
        //     }),
        // )
        // expect(analytics.popNew()).toEqual([
        //     {
        //         eventArgs: {
        //             category: 'Backup',
        //             action: 'onboarding-how-chosen',
        //             value: { type: 'manual' },
        //         },
        //     },
        // ])

        // // User tries to log in
        // const loginResult = await logic.processEvent({
        //     state: firstSessionState,
        //     localBackupSettings,
        //     analytics,
        //     event: { type: 'onLoginRequested' },
        //     remoteFunction: fakeRemoteFunctions({
        //         isAutomaticBackupEnabled: () => false,
        //         enableAutomaticBackup: () => undefined,
        //     }),
        // })
        // expect(loginResult).toEqual({
        //     redirect: { to: 'gdrive-login' },
        // })
        // expect(analytics.popNew()).toEqual([
        //     {
        //         eventArgs: {
        //             category: 'Backup',
        //             action: 'onboarding-login-requested',
        //         },
        //     },
        // ])
        // expect(localBackupSettings.popChanges()).toEqual([
        //     {
        //         type: 'set',
        //         key: 'backup.onboarding.authenticating',
        //         value: true,
        //     },
        // ])

        // localBackupSettings.setItem('drive-token-access', 'bla token')
        // localBackupSettings.popChanges()

        // // User lands back on the backup settings page after logging in
        // const secondSessionState = await logic.getInitialState({
        //     analytics,
        //     localBackupSettings,
        //     remoteFunction: fakeRemoteFunctions({
        //         isBackupBackendAuthenticated: () => true,
        //         hasInitialBackup: () => false,
        //         getBackupInfo: () => null,
        //         getBackendLocation: () => backendLocation,
        //         enableAutomaticBackup: () => undefined,
        //     }),
        // })
        // expect(secondSessionState).toEqual(
        //     expect.objectContaining({
        //         isAuthenticated: true,
        //         screen: 'running-backup',
        //     }),
        // )
        // expect(localBackupSettings.popChanges()).toEqual([
        //     { type: 'remove', key: 'backup.onboarding' },
        //     { type: 'remove', key: 'backup.onboarding.authenticating' },
        // ])

        // Backup finished, return to overview
        await triggerEvent(
            firstSessionState,
            { type: 'onFinish' },
            {
                remoteFunctions: {
                    isAutomaticBackupEnabled: () => false,
                    enableAutomaticBackup: () => undefined,
                },
            },
        )

        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'overview',
            }),
        )
    })
    // TODO: Fix this test
    it.skip('should be to able to backup through local server', async () => {
        return
        const { localBackupSettings, analytics, triggerEvent } = setupTest()

        const firstSessionState = await logic.getInitialState({
            analytics,
            localBackupSettings,
            remoteFunction: fakeRemoteFunctions({
                isBackupBackendAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
                enableAutomaticBackup: () => undefined,
                getBackendLocation: () => undefined,
            }),
        })

        await triggerEvent(
            firstSessionState,
            { type: 'onBackupRequested' },
            {
                remoteFunctions: {
                    isBackupBackendAuthenticated: () => false,
                    hasInitialBackup: () => false,
                    getBackupInfo: () => null,
                    getBackendLocation: () => undefined,
                    setBackendLocation: (choice) => undefined,
                    enableAutomaticBackup: () => undefined,
                },
            },
        )

        expect(firstSessionState).toEqual(
            expect.objectContaining({
                screen: 'onboarding-where',
            }),
        )

        await triggerEvent(
            firstSessionState,
            { type: 'onChoice', choice: 'local' },
            {
                remoteFunctions: {
                    isAutomaticBackupEnabled: () => false,
                    setBackendLocation: (choice) => 'local',
                    enableAutomaticBackup: () => undefined,
                },
            },
        )

        expect(firstSessionState).toEqual(
            expect.objectContaining({
                screen: 'running-backup',
            }),
        )

        // await triggerEvent(
        //     firstSessionState,
        //     { type: 'onChoice', choice: { type: 'manual' } },
        //     {
        //         remoteFunctions: {
        //             isAutomaticBackupEnabled: () => false,
        //             isAuthenticated: () => true,
        //             enableAutomaticBackup: () => undefined,
        //         },
        //     },
        // )
        // expect(firstSessionState).toEqual(
        //     expect.objectContaining({
        //         isAuthenticated: false,
        //         screen: 'onboarding-size',
        //     }),
        // )

        // // Remove previous analytics and local storage events
        // analytics.popNew()
        // localBackupSettings.popChanges()

        // await triggerEvent(
        //     firstSessionState,
        //     { type: 'onBackupRequested' },
        //     {
        //         remoteFunctions: {
        //             isAuthenticated: () => true,
        //             enableAutomaticBackup: () => undefined,
        //         },
        //     },
        // )
        // expect(firstSessionState).toEqual(
        //     expect.objectContaining({
        //         isAuthenticated: false,
        //         screen: 'running-backup',
        //     }),
        // )
        // expect(analytics.popNew()).toEqual([
        //     {
        //         eventArgs: {
        //             category: 'Backup',
        //             action: 'onboarding-backup-requested',
        //         },
        //     },
        // ])

        // Backup finished
        await triggerEvent(
            firstSessionState,
            { type: 'onFinish' },
            {
                remoteFunctions: {},
            },
        )

        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'overview',
            }),
        )
    })

    it('should be able to guide the user through the restore flow when they try to restore without being logged in', async () => {
        const { localBackupSettings, analytics, triggerEvent } = setupTest()

        let backendLocation: string
        const firstSessionState = await logic.getInitialState({
            analytics,
            localBackupSettings,
            remoteFunction: fakeRemoteFunctions({
                isBackupBackendAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
                getBackendLocation: () => backendLocation,
                setBackendLocation: (newChoice: string) =>
                    (backendLocation = newChoice),
            }),
        })
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'overview',
            }),
        )

        await triggerEvent(
            firstSessionState,
            { type: 'onRestoreRequested' },
            { remoteFunctions: {} },
        )
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'restore-where',
            }),
        )

        const choiceResult = await triggerEvent(
            firstSessionState,
            { type: 'onChoice', choice: 'google-drive' },
            {
                remoteFunctions: {
                    initRestoreProcedure: (provider) =>
                        (backendLocation = provider),
                    enableAutomaticBackup: () => undefined,
                },
            },
        )
        expect(choiceResult).toEqual({
            redirect: { to: 'gdrive-login' },
        })
        expect(
            await localBackupSettings.get('restoreIsAuthenticating'),
        ).toEqual(true)

        await localBackupSettings.set('accessToken', 'bla token')

        const secondSessionState = await logic.getInitialState({
            analytics,
            localBackupSettings,
            remoteFunction: fakeRemoteFunctions({
                isBackupBackendAuthenticated: () => true,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
                getBackendLocation: () => backendLocation,
            }),
        })
        expect(secondSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: true,
                screen: 'restore-running',
            }),
        )
        expect(
            await localBackupSettings.get('restoreIsAuthenticating'),
        ).toEqual(null)
    })

    it('should be able to handle a Drive login cancel during restore flow', async () => {
        const { localBackupSettings, analytics, triggerEvent } = setupTest()

        let backendLocation: string
        const firstSessionState = await logic.getInitialState({
            analytics,
            localBackupSettings,
            remoteFunction: fakeRemoteFunctions({
                isBackupBackendAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
                getBackendLocation: () => backendLocation,
            }),
        })
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'overview',
            }),
        )

        await triggerEvent(
            firstSessionState,
            { type: 'onRestoreRequested' },
            { remoteFunctions: {} },
        )
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'restore-where',
            }),
        )

        const choiceResult = await triggerEvent(
            firstSessionState,
            { type: 'onChoice', choice: 'google-drive' },
            {
                remoteFunctions: {
                    initRestoreProcedure: (provider) => null,
                    setBackendLocation: (choice: string) =>
                        (backendLocation = choice),
                    enableAutomaticBackup: () => undefined,
                },
            },
        )
        expect(choiceResult).toEqual({
            redirect: { to: 'gdrive-login' },
        })
        expect(
            await localBackupSettings.get('restoreIsAuthenticating'),
        ).toEqual(true)

        const secondSessionState = await logic.getInitialState({
            analytics,
            localBackupSettings,
            remoteFunction: fakeRemoteFunctions({
                isBackupBackendAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
                getBackendLocation: () => backendLocation,
            }),
        })
        expect(secondSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'restore-where',
            }),
        )
        expect(
            await localBackupSettings.get('restoreIsAuthenticating'),
        ).toEqual(null)
    })

    it('should be able to guide the user through the restore flow when they try to restore while being logged in', async () => {
        const { localBackupSettings, analytics, triggerEvent } = setupTest()

        let backendLocation: string
        const firstSessionState = await logic.getInitialState({
            analytics,
            localBackupSettings,
            remoteFunction: fakeRemoteFunctions({
                isBackupBackendAuthenticated: () => true,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
                getBackendLocation: () => backendLocation,
            }),
        })
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: true,
                screen: 'overview',
            }),
        )

        await triggerEvent(
            firstSessionState,
            { type: 'onRestoreRequested' },
            { remoteFunctions: {} },
        )
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: true,
                screen: 'restore-where',
            }),
        )

        await triggerEvent(
            firstSessionState,
            { type: 'onChoice', choice: 'google-drive' },
            {
                remoteFunctions: {
                    initRestoreProcedure: (provider) =>
                        (backendLocation = provider),
                    enableAutomaticBackup: () => undefined,
                },
            },
        )
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: true,
                screen: 'restore-running',
            }),
        )
    })

    it('should be able to guide the user through the restore flow when using local', async () => {
        const { localBackupSettings, analytics, triggerEvent } = setupTest()

        let backendLocation: string
        const firstSessionState = await logic.getInitialState({
            analytics,
            localBackupSettings,
            remoteFunction: fakeRemoteFunctions({
                isBackupBackendAuthenticated: () => false,
                hasInitialBackup: () => false,
                getBackupInfo: () => null,
                getBackendLocation: () => backendLocation,
            }),
        })
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'overview',
            }),
        )

        await triggerEvent(
            firstSessionState,
            { type: 'onRestoreRequested' },
            { remoteFunctions: {} },
        )
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'restore-where',
            }),
        )

        await triggerEvent(
            firstSessionState,
            { type: 'onChoice', choice: 'local' },
            {
                remoteFunctions: {
                    initRestoreProcedure: (provider) =>
                        (backendLocation = provider),
                },
            },
        )
        expect(firstSessionState).toEqual(
            expect.objectContaining({
                isAuthenticated: false,
                screen: 'restore-running',
            }),
        )
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
                    localBackupSettings: {} as any,
                    remoteFunction: 'remoteFunction' as any,
                    analytics: 'analytics',
                },
                eventProcessor: async (args) => {
                    calls.push({ type: 'process', args })
                    return { screen: 'bla', redirect: null }
                },
                onStateChange: (args) => calls.push({ type: 'state', args }),
                onRedirect: (args) => calls.push({ type: 'redirect', args }),
            })
            await handlers['bla']()
            expect(calls).toEqual([
                {
                    type: 'process',
                    args: {
                        state: {},
                        event: { type: 'bla' },
                        localBackupSettings: {},
                        remoteFunction: 'remoteFunction',
                        analytics: 'analytics',
                    },
                },
                { type: 'state', args: { screen: 'bla', redirect: null } },
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
                    localBackupSettings: {} as any,
                    remoteFunction: 'remoteFunction' as any,
                    analytics: 'analytics',
                },
                eventProcessor: async (args) => {
                    calls.push({ type: 'process', args })
                    return { screen: 'bla', redirect: null }
                },
                onStateChange: (args) => calls.push({ type: 'state', args }),
                onRedirect: (args) => calls.push({ type: 'redirect', args }),
            })
            await handlers['bla']('foo')
            expect(calls).toEqual([
                {
                    type: 'process',
                    args: {
                        state: {},
                        event: { type: 'bla', arg: 'foo' },
                        localBackupSettings: {},
                        remoteFunction: 'remoteFunction',
                        analytics: 'analytics',
                    },
                },
                { type: 'state', args: { screen: 'bla', redirect: null } },
            ])
        })
    })
})
