import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import initSentry from '../util/raven'
import { reducer as collectionsBtn } from './collections-button'
import { reducer as bookmarkBtn } from './bookmark-button'
import { reducer as sidebarBtn } from './sidebar-button'
import { reducer as sidebarOpenBtn } from './sidebar-open-button'
import { reducer as tooltipBtn } from './tooltip-button'
import { reducer as notifsBtn } from './notif-button'
import { reducer as pauseBtn } from './pause-button'
import popup from './reducer'

const rootReducer = combineReducers({
    collectionsBtn,
    bookmarkBtn,
    sidebarBtn,
    sidebarOpenBtn,
    tooltipBtn,
    notifsBtn,
    pauseBtn,
    popup,
})

export default function configureStore() {
    const middlewares = [thunk]

    initSentry({ reduxMiddlewares: middlewares })

    const enhancers = [applyMiddleware(...middlewares)]

    return createStore(rootReducer, undefined, compose(...enhancers))
}
