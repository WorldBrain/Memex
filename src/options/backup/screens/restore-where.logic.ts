import {
    reactEventHandler,
    handleEvent,
    compositeEventProcessor,
} from 'src/util/ui-logic'

export const PROVIDERS = {
    'google-drive': true,
}
export const INITIAL_STATE = {
    provider: null,
    valid: false,
}

export const processEvent = compositeEventProcessor({
    onProviderChoice: ({ state, event }) => {
        const provider = event.value
        const valid = !!PROVIDERS[provider]
        return {
            updateState: { provider: valid ? provider : state.provider, valid },
        }
    },
    onConfirm: ({ state, event }) => {
        return {
            dispatch: state.valid && {
                type: 'onChoice',
                choice: state.provider,
            },
        }
    },
})

export { reactEventHandler, handleEvent }
