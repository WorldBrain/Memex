import expect from 'expect'
import * as logic from './restore-where.logic'
import { setupUiLogicTest } from 'src/util/ui-logic'

describe('Restore where choice logic', () => {
    it('should work with google-drive', async () => {
        const { state, events, trigger } = setupUiLogicTest({
            inititalState: logic.INITIAL_STATE,
            eventNames: ['onChoice'],
            eventProcessor: logic.processEvent,
        })

        trigger({ type: 'onConfirm' })
        expect(events.log).toEqual([])

        trigger({ type: 'onProviderChoice', value: 'google-drive' })
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            provider: 'google-drive',
            valid: true,
        })

        trigger({ type: 'onConfirm' })
        expect(events.log).toEqual([
            { event: 'onChoice', args: ['google-drive'] },
        ])
    })

    it('should work with local-backup', async () => {
        const { state, events, trigger } = setupUiLogicTest({
            inititalState: logic.INITIAL_STATE,
            eventNames: ['onChoice'],
            eventProcessor: logic.processEvent,
        })

        trigger({ type: 'onProviderChoice', value: 'local' })
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            provider: 'local',
            valid: false,
        })

        trigger({ type: 'onChangeBackupPath', backupPath: '/home' })
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            provider: 'local',
            valid: true,
            backupPath: '/home',
        })

        trigger({ type: 'onConfirm' })
        expect(events.log).toEqual([{ event: 'onChoice', args: ['local'] }])
    })

    it('goes through local server not running flow', async () => {
        const { state, events, trigger } = setupUiLogicTest({
            inititalState: logic.INITIAL_STATE,
            eventNames: ['onChoice'],
            eventProcessor: logic.processEvent,
        })

        trigger({ type: 'onProviderChoice', value: 'local' })
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            provider: 'local',
            valid: false,
        })

        trigger({ type: 'onChangeOverlay', overlay: 'download' })
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            provider: 'local',
            valid: false,
            overlay: 'download',
        })

        trigger({ type: 'onConfirm' })
        expect(events.log).toEqual([])

        trigger({ type: 'onChangeOverlay', overlay: null })
        trigger({ type: 'onChangeBackupPath', backupPath: '/home' })
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            provider: 'local',
            backupPath: '/home',
            valid: true,
        })

        trigger({ type: 'onConfirm' })
        expect(events.log).toEqual([{ event: 'onChoice', args: ['local'] }])
    })
})
