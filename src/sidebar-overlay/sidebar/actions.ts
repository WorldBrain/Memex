import { createAction } from 'redux-act'

// import { Thunk } from '../types'
// import * as selectors from './selectors'

export const setSidebarOpen = createAction<boolean>('setSidebarOpen')

// export const toggleSidebar: () => Thunk = () => (dispatch, getState) => {
//     const isOpen = selectors.isOpen(getState())
//     dispatch(setSidebarOpen(!isOpen))
// }

export const setUserCommenting = createAction<boolean>('setUserCommenting')
