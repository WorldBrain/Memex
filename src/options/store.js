import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import * as blacklist from './blacklist'
import * as imports from './imports'

const rootReducer = combineReducers({
    blacklist: blacklist.reducer,
    imports: imports.reducer,
})

export default function configureStore({ReduxDevTools = undefined} = {}) {
    const enhancers = [
        blacklist.enhancer,
        imports.enhancer,
        applyMiddleware(
            thunk,
        ),
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
