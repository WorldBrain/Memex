import { combineReducers } from 'redux'
import RootState from './types'

import { reducer as collectionsBtn } from 'src/popup/collections-button'
import { reducer as tagsBtn } from 'src/popup/tags-button'
import {
    reducer as sidebar,
    State as SidebarState,
} from 'src/sidebar-overlay/sidebar'

const rootReducer = combineReducers<RootState>({
    collectionsBtn,
    tagsBtn,
    sidebar,
})

export default rootReducer
