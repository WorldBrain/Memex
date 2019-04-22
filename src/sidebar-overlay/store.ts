import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import { createEpicMiddleware, combineEpics } from 'redux-observable'

import rootReducer from './reducer'

import * as epics from './epics'

const configureStore = () => {
    const rootEpic = combineEpics(...Object.values(epics))

    const middlewares = [createEpicMiddleware(rootEpic), thunk]

    const enhancers = [applyMiddleware(...middlewares)]

    return createStore(rootReducer, undefined, compose(...enhancers))
}

export default configureStore
