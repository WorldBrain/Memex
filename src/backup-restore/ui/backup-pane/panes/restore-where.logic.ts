import {
    reactEventHandler,
    handleEvent,
    compositeEventProcessor,
} from 'src/util/ui-logic'

interface Providers {
    [provider: string]: boolean
}
interface State {
    provider: 'google-drive' | 'local'
    valid: boolean
    backupPath: string
    overlay: string
}

export const PROVIDERS: Providers = {
    'google-drive': true,
    local: true,
}

export const INITIAL_STATE: State = {
    provider: null,
    valid: false,
    backupPath: null,
    overlay: null,
}

/**
 * Reducer function to find the current valid state.
 */
const isValid = (provider: string, backupPath: string): boolean =>
    provider === 'google-drive' || (provider === 'local' && !!backupPath)

export const processEvent = compositeEventProcessor({
    onChangeOverlay: ({ event }) => {
        const overlay = event.overlay
        return {
            updateState: { overlay },
        }
    },
    onChangeBackupPath: ({ state, event }) => {
        const backupPath = event.backupPath
        const valid = isValid(state.provider, backupPath)

        return {
            updateState: { backupPath, valid },
        }
    },
    onProviderChoice: ({ state, event }) => {
        const provider = event.value
        // const valid = !!PROVIDERS[provider]
        const valid = isValid(provider, state.backupPath)

        return {
            updateState: { provider, valid },
        }
    },
    onConfirm: ({ state, event }) => {
        return {
            dispatch: state.valid && {
                type: 'onChoice',
                args: {
                    choice: state.provider,
                },
            },
        }
    },
})

export { reactEventHandler, handleEvent }
