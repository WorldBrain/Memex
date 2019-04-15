import { combineReducers } from 'redux'

import RootState from './types'
import { reducer as ribbon } from './ribbon'
import { reducer as sidebar } from './sidebar'
import { reducer as collectionsBtn } from 'src/popup/collections-button'
import { reducer as bookmarkBtn } from 'src/popup/bookmark-button'
import { reducer as pauseBtn } from 'src/popup/pause-button'
import { reducer as tagsBtn } from 'src/popup/tags-button'
import popup from 'src/popup/reducer'
import { reducer as searchBar } from 'src/overview/search-bar'
import { reducer as results } from 'src/overview/results'
import { reducer as searchFilters } from 'src/search-filters'
import { reducer as deleteConfModal } from 'src/overview/delete-confirm-modal'
import { reducer as customLists } from 'src/custom-lists'

const rootReducer = combineReducers<RootState>({
    ribbon,
    sidebar,
    collectionsBtn,
    bookmarkBtn,
    pauseBtn,
    tagsBtn,
    popup,
    searchBar,
    searchFilters,
    results,
    customLists,
    deleteConfModal,
})

export default rootReducer
