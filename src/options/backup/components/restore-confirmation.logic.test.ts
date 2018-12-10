import * as fromPairs from 'lodash/fromPairs'
import * as expect from 'expect'
import { fakeRemoteFunction } from 'src/util/webextensionRPC'
import * as logic from './restore-confirmation.logic'

export function fakeState(initial) {
    const state = { ...initial }
    const setState = updates => {
        Object.assign(state, updates)
    }
    return { state, setState }
}

export function fakeEventProps(eventNames) {
    const events = { log: [] }
    const props = fromPairs(
        eventNames.map(eventName => [
            eventName,
            (...args) => events.log.push({ event: eventName, args }),
        ]),
    )
    return { events, props }
}

export function setup({ inititalState, eventNames, eventProcessor }) {
    const { state, setState } = fakeState(inititalState)
    const { props, events } = fakeEventProps(eventNames)
    const trigger = event =>
        logic.handleEvent({
            eventProcessor,
            state,
            setState,
            props,
            event,
        })
    return { state, setState, props, events, trigger }
}

describe('Restore confirmation logic', () => {
    it('should work', async () => {
        const { state, events, trigger } = setup({
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
