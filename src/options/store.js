import { createStore, combineReducers } from 'redux'

import { reducer as blacklist } from './blacklist'

const rootReducer = combineReducers({
    blacklist,
})

export default function configureStore({ReduxDevTools=undefined}={}) {
    return createStore(
        rootReducer,
        undefined, // Initial State
        ReduxDevTools && ReduxDevTools.instrument()
    )
}
