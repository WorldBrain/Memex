export const CONFIRMATION_WORD = 'RESTORE'
export const INITIAL_STATE = {
    confirmation: '',
    confirmed: false,
}

export function processEvent(state, event) {
    if (event.type === 'onConfirmationChange') {
        const confirmed = event.value === CONFIRMATION_WORD
        return {
            state: {
                confirmation: event.value,
                confirmed,
            },
            dispatch: confirmed && 'onConfirm',
        }
    } else if (event.type === 'onClose') {
        return { dispatch: 'onClose' }
    }
}

export function handleEvent({ eventProcessor, state, setState, props, event }) {
    const result = eventProcessor(state, event)
    if (result.state) {
        setState(result.state)
    }
    if (result.dispatch) {
        const handler = props[result.dispatch]
        if (!handler) {
            console.error(
                `Event dispatched without handler: ${result.dispatch}`,
            )
        }
        handler()
    }
}

export function reactEventHandler(component, eventProcessor) {
    return event => {
        handleEvent({
            eventProcessor,
            state: component.state,
            props: component.props,
            setState: component.setState.bind(this),
            event,
        })
    }
}
