import { combineReducers } from 'redux'

import RootState from './types'
import { reducer as ribbon } from './ribbon'

const rootReducer = combineReducers<RootState>({
    ribbon,
})

export default rootReducer
