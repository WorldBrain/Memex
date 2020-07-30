import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import rootReducer from './reducer'

export default function configureStore() {
    const middlewares = [thunk]

    const enhancers = [applyMiddleware(...middlewares)]

    return createStore(rootReducer, undefined, compose(...enhancers))
}
