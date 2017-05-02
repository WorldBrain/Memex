import { createStore, combineReducers, compose } from 'redux'

import * as blacklist from './blacklist'
import * as imports from './imports'

const rootReducer = combineReducers({
    blacklist: blacklist.reducer,
    imports: imports.reducer,
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
