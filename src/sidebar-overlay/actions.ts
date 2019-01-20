import { Thunk } from './types'
import { actions as ribbonActions } from './ribbon'
import { actions as sidebarActions } from '../sidebar-common'

export const initState: () => Thunk = () => dispatch => {
    dispatch(ribbonActions.setIsExpanded(false))
    dispatch(sidebarActions.setSidebarOpen(false))
}
