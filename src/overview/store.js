import 'core-js/fn/object/values' // shim Object.values for Chromium<54
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import { createEpicMiddleware, combineEpics } from 'redux-observable'
import Raven from 'raven-js'
import createRavenMiddleware from 'raven-for-redux'
import thunk from 'redux-thunk'

import overview from 'src/overview'
import { reducer as onboarding } from 'src/overview/onboarding'
import { reducer as filters } from 'src/overview/filters'

const rootReducer = combineReducers({
    overview: overview.reducer,
    onboarding,
    filters,
})

const rootEpic = combineEpics(...Object.values(overview.epics))

export default function configureStore({ ReduxDevTools = undefined } = {}) {
    const middlewares = [createEpicMiddleware(rootEpic), thunk]

    // Set up the sentry runtime error config + redux middleware
    if (process.env.SENTRY_DSN) {
        Raven.config(process.env.SENTRY_DSN).install()
        middlewares.push(createRavenMiddleware(Raven))
    }

    const enhancers = [overview.enhancer, applyMiddleware(...middlewares)]
    if (ReduxDevTools) {
        enhancers.push(ReduxDevTools.instrument())
    }
    const enhancer = compose(...enhancers)

    const store = createStore(
        rootReducer,
        undefined, // initial state
        enhancer,
    )

    return store
}
