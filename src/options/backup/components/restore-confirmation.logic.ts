import {
    reactEventHandler,
    handleEvent,
    compositeEventProcessor,
} from 'src/util/ui-logic'

export const CONFIRMATION_WORD = 'RESTORE'
export const INITIAL_STATE = {
    confirmation: '',
    confirmed: false,
}

export const processEvent = compositeEventProcessor({
    onConfirmationChange: ({ event }) => {
        const confirmed = event.value === CONFIRMATION_WORD
        return {
            updateState: {
                confirmation: event.value,
                confirmed,
            },
            dispatch: confirmed ? { type: 'onConfirm' } : null,
        }
    },
    onClose: () => {
        return { dispatch: { type: 'onClose' } }
    },
})

export { reactEventHandler, handleEvent }
