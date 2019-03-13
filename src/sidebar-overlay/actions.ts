import { Thunk } from './types'
import { actions as ribbonActions } from './ribbon'
import { actions as sidebarActions } from '../sidebar-common'
import * as popupActs from 'src/popup/actions'

export const initState: () => Thunk = () => dispatch => {
    dispatch(ribbonActions.setIsExpanded(false))
    dispatch(sidebarActions.setSidebarOpen(false))
    dispatch(popupActs.initState())
}
