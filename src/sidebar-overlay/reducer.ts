import { combineReducers } from 'redux'

import RootState from './types'
import { reducer as ribbon } from './ribbon'
import { reducer as sidebar } from './sidebar'
import { reducer as collectionsBtn } from 'src/popup/collections-button'
import { reducer as bookmarkBtn } from 'src/popup/bookmark-button'
import { reducer as pauseBtn } from 'src/popup/pause-button'
import { reducer as tagsBtn } from 'src/popup/tags-button'
import popup from 'src/popup/reducer'

const rootReducer = combineReducers<RootState>({
    ribbon,
    sidebar,
    collectionsBtn,
    bookmarkBtn,
    pauseBtn,
    tagsBtn,
    popup,
})

export default rootReducer
