import { combineReducers } from 'redux'

import { reducer as collectionsBtn } from 'src/popup/collections-button'
import {
    reducer as sidebar,
    State as SidebarState,
} from 'src/sidebar-overlay/sidebar'

const rootReducer = combineReducers({
    collectionsBtn,
    sidebar,
})

export default rootReducer
