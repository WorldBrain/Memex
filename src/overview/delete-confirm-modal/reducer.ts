import { createReducer } from 'redux-act'

import * as acts from './actions'

export interface State {
    /** Denotes whether or not to show the delete results modal. */
    isShown: boolean
    /** URL to attempt to delete. */
    url: string
    /** Index of the result to delete. */
    deleteIndex: number
}

const defState: State = {
    isShown: false,
    url: undefined,
    deleteIndex: undefined,
}

const reducer = createReducer<State>({}, defState)

reducer.on(acts.show, (state, { url, index }) => ({
    ...state,
    isShown: true,
    url,
    deleteIndex: index,
}))

reducer.on(acts.hide, state => ({
    ...state,
    isShown: false,
}))

reducer.on(acts.reset, () => ({ ...defState }))

reducer.on(acts.resetDeleteIndex, state => ({
    ...state,
    deleteIndex: defState.deleteIndex,
}))

export default reducer
