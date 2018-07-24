import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import sidebar from './reducer'
import { reducer as commentBox } from '../CommentBox/'

const rootReducer = combineReducers({
    sidebar,
    commentBox,
})

const store = createStore(rootReducer, undefined, applyMiddleware(thunk))

export default store
