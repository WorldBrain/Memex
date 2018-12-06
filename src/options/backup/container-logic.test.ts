import * as expect from 'expect'
import { fakeRemoteFunction } from 'src/util/webextensionRPC'
import * as logic from './container-logic'
import { MemoryLocalStorage } from 'src/util/tests/local-storage'
import { FakeAnalytics } from 'src/analytics'

describe('Backup settings container logic', () => {
    it('should be able to guide the user through the onboarding flow', async () => {
        const localStorage = new MemoryLocalStorage()
        const analytics = new FakeAnalytics()

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
            screen: 'onboarding-where',
        })
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

        Object.assign(
            firstSessionState,
            await logic.processEvent({
                state: firstSessionState,
                localStorage,
                analytics,
                event: { type: 'onChoice' },
                remoteFunction: fakeRemoteFunction({
                    isAutomaticBackupEnabled: () => false,
                }),
            }),
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

        Object.assign(
            firstSessionState,
            await logic.processEvent({
                state: firstSessionState,
                localStorage,
                analytics,
                event: { type: 'onChoice', choice: { type: 'manual' } },
                remoteFunction: fakeRemoteFunction({
                    isAutomaticBackupEnabled: () => false,
                }),
            }),
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
        Object.assign(
            secondSessionState,
            await logic.processEvent({
                state: secondSessionState,
                localStorage,
                analytics,
                event: { type: 'onFinish' },
                remoteFunction: fakeRemoteFunction({
                    isAutomaticBackupEnabled: () => false,
                }),
            }),
        )
        expect(secondSessionState).toEqual({
            isAuthenticated: true,
            screen: 'overview',
        })
    })
})
