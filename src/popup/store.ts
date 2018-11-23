import { createStore, combineReducers, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'

import initSentry from '../util/raven'
import { reducer as collectionsBtn } from './collections-button'
import { reducer as blacklistBtn } from './blacklist-button'
import { reducer as bookmarkBtn } from './bookmark-button'
import { reducer as inPageSwitches } from './in-page-switches'
import { reducer as notifsBtn } from './notif-button'
import { reducer as pauseBtn } from './pause-button'
import { reducer as tagsBtn } from './tags-button'
import popup from './reducer'

const rootReducer = combineReducers({
    collectionsBtn,
    blacklistBtn,
    bookmarkBtn,
    inPageSwitches,
    notifsBtn,
    pauseBtn,
    tagsBtn,
    popup,
})

export default function configureStore() {
    const middlewares = [thunk]

    initSentry(middlewares)

    const enhancers = [applyMiddleware(...middlewares)]

    return createStore(rootReducer, undefined, compose(...enhancers))
}
