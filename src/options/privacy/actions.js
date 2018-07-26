import { createAction } from 'redux-act'

import { storeTrackingOption } from 'src/analytics/store-tracking-option'

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

export const toggleTrackingOptOut = (
    isOptIn,
    skipEventTrack = false,
) => async dispatch => {
    dispatch(setTrackingFlag(isOptIn))
    await storeTrackingOption(isOptIn, skipEventTrack)
}
