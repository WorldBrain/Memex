import { createAction } from 'redux-act'

import analytics from 'src/analytics'

export const setTrackingFlag = createAction(
    'privacy/setTrackingFlag',
    value => {
        // Value will be string from UI events, else bool from storage syncing
        if (typeof value === 'string') {
            return value === 'y'
        }

        return value
    },
)

export const toggleTrackingOptOut = isOptIn => async dispatch => {
    const trackEvent = () =>
        analytics.trackEvent({
            category: 'Privacy',
            action: 'Change tracking pref',
            name: isOptIn ? 'opt-in' : 'opt-out',
        })

    // Do event track after state change, as the event may be a noop if opt-out state is already set
    if (isOptIn) {
        dispatch(setTrackingFlag(isOptIn))
        await trackEvent()
    } else {
        await trackEvent()
        dispatch(setTrackingFlag(isOptIn))
    }
}
