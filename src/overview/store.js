import 'core-js/fn/object/values' // shim Object.values for Chromium<54
import { createStore, applyMiddleware, compose, combineReducers } from 'redux'
import { createEpicMiddleware, combineEpics } from 'redux-observable'
import thunk from 'redux-thunk'

import overview from 'src/overview'
import options from 'src/options'

const rootReducer = combineReducers({
    overview: overview.reducer,
    options: options.reducer
})

const rootEpic = combineEpics(
    ...Object.values(overview.epics)
)

export default function configureStore({ReduxDevTools = undefined} = {}) {
    const enhancers = [
        overview.enhancer,
        applyMiddleware(
            createEpicMiddleware(rootEpic),
            thunk
        ),
    ]
    if (ReduxDevTools) {
        enhancers.push(ReduxDevTools.instrument())
    }
    const enhancer = compose(...enhancers)

    const store = createStore(
        rootReducer,
        undefined, // initial state
        enhancer
    )

    return store
}
