import { createReducer } from 'redux-act'

import * as acts from './actions'
import { VISIT_DELAY_RANGE } from './constants'

export interface State {
    visits: boolean
    bookmarks: boolean
    memexLinks: boolean
    stubs: boolean
    screenshots: boolean
    visitDelay: number
}

export const defaultState: State = {
    stubs: false,
    visits: true,
    bookmarks: true,
    memexLinks: true,
    screenshots: false,
    visitDelay: VISIT_DELAY_RANGE.DEF,
}

const toggleState = (key) => (state: State) => ({
    ...state,
    [key]: !state[key],
})

const initState = <T>(key) => (state: State, payload: T) => ({
    ...state,
    [key]: payload,
})

const reducer = createReducer<State>({}, defaultState)

reducer.on(acts.initBookmarks, initState<boolean>('bookmarks'))
reducer.on(acts.initLinks, initState<boolean>('memexLinks'))
reducer.on(acts.initStubs, initState<boolean>('stubs'))
reducer.on(acts.initVisits, initState<boolean>('visits'))
reducer.on(acts.initVisitDelay, initState<number>('visitDelay'))
reducer.on(acts.initScreenshots, initState<boolean>('screenshots'))

reducer.on(acts.toggleBookmarks, toggleState('bookmarks'))
reducer.on(acts.toggleLinks, toggleState('memexLinks'))
reducer.on(acts.toggleStubs, toggleState('stubs'))
reducer.on(acts.toggleVisits, toggleState('visits'))
reducer.on(acts.toggleScreenshots, toggleState('screenshots'))

reducer.on(acts.changeVisitDelay, (state, visitDelay) => ({
    ...state,
    visitDelay,
}))

export default reducer
