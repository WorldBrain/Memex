import { createAction } from 'redux-act'

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
