import * as privacyAct from '../options/privacy/actions'

export const actionRegistry = {
    'track-option-change': ({ definition }) => {
        return privacyAct.toggleTrackingOptOut(definition.key)
    },
    'go-to-url': ({ definition }) => {
        return () => {
            window.location.href = definition.url
        }
    }
}