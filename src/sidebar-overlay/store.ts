import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import rootReducer from './reducer'

const configureStore = () => {
    const middlewares = [thunk]

    const enhancers = [applyMiddleware(...middlewares)]

    return createStore(rootReducer, undefined, compose(...enhancers))
}

export default configureStore
