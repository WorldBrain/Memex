import * as expect from 'expect'
import * as logic from './restore-confirmation.logic'
import { setupUiLogicTest } from 'src/util/ui-logic'

describe('Restore confirmation logic', () => {
    it('should work', async () => {
        const { state, events, trigger } = setupUiLogicTest({
            inititalState: logic.INITIAL_STATE,
            eventNames: ['onConfirm', 'onClose'],
            eventProcessor: logic.processEvent,
        })

        trigger({ type: 'onClose' })
        expect(events.log).toEqual([{ event: 'onClose', args: [] }])
        expect(state).toEqual(logic.INITIAL_STATE)

        trigger({ type: 'onConfirmationChange', value: 'bla' })
        expect(events.log).toEqual([{ event: 'onClose', args: [] }])
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            confirmation: 'bla',
        })

        trigger({
            type: 'onConfirmationChange',
            value: logic.CONFIRMATION_WORD,
        })
        expect(events.log).toEqual([
            { event: 'onClose', args: [] },
            { event: 'onConfirm', args: [] },
        ])
        expect(state).toEqual({
            ...logic.INITIAL_STATE,
            confirmation: logic.CONFIRMATION_WORD,
            confirmed: true,
        })
    })
})
