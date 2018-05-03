import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import initSentry from '../util/raven'
import * as imports from './imports'
import * as blacklist from './blacklist'
import * as privacy from './privacy'

const rootReducer = combineReducers({
    blacklist: blacklist.reducer,
    imports: imports.reducer,
    privacy: privacy.reducer,
})

export default function configureStore({ ReduxDevTools = undefined } = {}) {
    const middlewares = [thunk]

    initSentry(middlewares)

    const enhancers = [
        imports.enhancer,
        privacy.enhancer,
        applyMiddleware(...middlewares),
    ]

    if (ReduxDevTools) {
        enhancers.push(ReduxDevTools.instrument())
    }

    const enhancer = compose(...enhancers)

    return createStore(
        rootReducer,
        undefined, // Initial State
        enhancer,
    )
}
