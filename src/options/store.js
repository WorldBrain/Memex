import { createStore, combineReducers, compose } from 'redux'

import * as blacklist from './blacklist'

const rootReducer = combineReducers({
    blacklist: blacklist.reducer,
})

export default function configureStore({ReduxDevTools = undefined} = {}) {
    const enhancers = [
        blacklist.enhancer,
    ]

    if (ReduxDevTools) {
        enhancers.push(ReduxDevTools.instrument())
    }

    const enhancer = compose(...enhancers)

    return createStore(
        rootReducer,
        undefined, // Initial State
        enhancer
    )
}
