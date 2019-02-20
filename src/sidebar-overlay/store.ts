import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import initSentry from 'src/util/raven'
import rootReducer from './reducer'

const configureStore = () => {
    const middlewares = [thunk]

    initSentry(middlewares)

    const enhancers = [applyMiddleware(...middlewares)]

    return createStore(rootReducer, undefined, compose(...enhancers))
}

export default configureStore
