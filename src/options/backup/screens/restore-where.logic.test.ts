import * as expect from 'expect'
import * as logic from './restore-where.logic'
import { setupUiLogicTest } from 'src/util/ui-logic'

describe('Restore where choice logic', () => {
    it('should work', async () => {
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
        expect(events.log).toEqual([{ event: 'onChoice', args: [] }])
    })
})
