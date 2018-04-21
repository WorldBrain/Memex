import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import * as imports from './imports'
import * as blacklist from './blacklist'
import * as privacy from './privacy'
import * as notifications from './notifications'

const rootReducer = combineReducers({
    blacklist: blacklist.reducer,
    imports: imports.reducer,
    privacy: privacy.reducer,
    notifications: notifications.reducer,
})

export default function configureStore({ ReduxDevTools = undefined } = {}) {
    const enhancers = [
        imports.enhancer,
        privacy.enhancer,
        notifications.enhancer,
        applyMiddleware(thunk),
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
