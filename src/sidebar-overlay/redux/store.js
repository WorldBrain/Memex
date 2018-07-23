import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import reducer from './reducer'
import commentBox from '../CommentBox/reducer'

const rootReducer = combineReducers({
    ...reducer,
    commentBox,
})

const store = createStore(rootReducer, applyMiddleware(thunk))

export default store
