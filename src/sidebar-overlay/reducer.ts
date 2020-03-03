import { combineReducers } from 'redux'

import RootState from './types'
import ribbon from './ribbon/reducer'
import sidebar from './sidebar/reducer'
import collectionsBtn from 'src/popup/collections-button/reducer'
import bookmarkBtn from 'src/popup/bookmark-button/reducer'
import pauseBtn from 'src/popup/pause-button/reducer'
import tagsBtn from 'src/popup/tags-button/reducer'
import popup from 'src/popup/reducer'
import searchBar from 'src/overview/search-bar/reducer'
import results from 'src/overview/results/reducer'
import searchFilters from 'src/search-filters/reducer'
import deleteConfModal from 'src/overview/delete-confirm-modal/reducer'
import customLists from 'src/custom-lists/reducer'

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
