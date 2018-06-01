import { createAction } from 'redux-act'

import { VISIT_DELAY_RANGE } from './constants'

export const initBookmarks = createAction('index-prefs/init-bookmarks')
export const initLinks = createAction('index-prefs/init-links')
export const initStubs = createAction('index-prefs/init-stubs')
export const initVisits = createAction('index-prefs/init-visits')
export const initVisitDelay = createAction<number>(
    'index-prefs/init-visit-delay',
)

export const toggleBookmarks = createAction('index-prefs/toggle-bookmarks')
export const toggleLinks = createAction('index-prefs/toggle-links')
export const toggleStubs = createAction('index-prefs/toggle-stubs')
export const toggleVisits = createAction('index-prefs/toggle-visits')

export const changeVisitDelay = createAction<number>(
    'index-prefs/change-visit-delay',
    value => {
        if (value > VISIT_DELAY_RANGE.MAX) {
            return VISIT_DELAY_RANGE.MAX
        } else if (value < VISIT_DELAY_RANGE.MIN) {
            return VISIT_DELAY_RANGE.MIN
        } else {
            return value
        }
    },
)
