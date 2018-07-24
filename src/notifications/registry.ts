import * as privacyAct from '../options/privacy/actions'

export const actionRegistry = {
    'toggle-storage-option': ({ definition }) => {
        privacyAct.storeTrackingOption(definition.value)
    },
    'go-to-url': ({ definition }) => {
        return () => {
            window.location.href = definition.url
        }
    }
}