import { createAction } from 'redux-act'

export const setTrackingFlag = createAction(
    'privacy/setTrackingFlag',
    value => value === 'y',
)
