import { combineReducers } from 'redux'

import RootState from './types'
import { reducer as ribbon } from './ribbon'
import { reducer as sidebar } from 'src/sidebar-common'
import { reducer as collectionsBtn } from 'src/popup/collections-button'
import { reducer as blacklistBtn } from 'src/popup/blacklist-button'
import { reducer as bookmarkBtn } from 'src/popup/bookmark-button'
import { reducer as sidebarBtn } from 'src/popup/sidebar-button'
import { reducer as tooltipBtn } from 'src/popup/tooltip-button'
import { reducer as notifsBtn } from 'src/popup/notif-button'
import { reducer as pauseBtn } from 'src/popup/pause-button'
import { reducer as tagsBtn } from 'src/popup/tags-button'
import popup from 'src/popup/reducer'

const rootReducer = combineReducers<RootState>({
    ribbon,
    sidebar,
    collectionsBtn,
    blacklistBtn,
    bookmarkBtn,
    sidebarBtn,
    tooltipBtn,
    notifsBtn,
    pauseBtn,
    tagsBtn,
    popup,
})

export default rootReducer
