import { storeTrackingOption } from '../analytics/store-tracking-option'
import * as actionTypes from './action-types'

export const actionRegistry = {
    [actionTypes.TOGGLE_SETTING]: ({ definition }) => {
        storeTrackingOption(definition.value)
    },
    [actionTypes.OPEN_URL]: ({ definition }) => {
        return () => {
            window.location.href = definition.url
        }
    },
}
