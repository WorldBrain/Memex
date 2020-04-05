import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import RootState from './types'

import rootReducer from './reducer'

export default function configureStore() {
    const middlewares = [thunk]

    const enhancers = [applyMiddleware(...middlewares)]

    return createStore(rootReducer, undefined, compose(...enhancers))
}
