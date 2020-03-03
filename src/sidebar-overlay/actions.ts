import { Thunk } from './types'
import * as ribbonActions from './ribbon/actions'
import * as sidebarActions from './sidebar/actions'
import * as popupActs from 'src/popup/actions'

export const initState: () => Thunk = () => dispatch => {
    dispatch(ribbonActions.setIsExpanded(false))
    dispatch(sidebarActions.setSidebarOpen(false))
    dispatch(popupActs.initState())
}
