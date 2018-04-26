import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import Raven from 'raven-js'
import createRavenMiddleware from 'raven-for-redux'
import thunk from 'redux-thunk'

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

    // Set up the sentry runtime error config + redux middleware
    if (process.env.SENTRY_DSN) {
        Raven.config(process.env.SENTRY_DSN).install()
        middlewares.push(createRavenMiddleware(Raven))
    }

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
