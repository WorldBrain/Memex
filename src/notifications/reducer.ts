import { createReducer } from 'redux-act'

import * as actions from './actions'

export interface State {
    readNotificationList: {
        notifications: any[]
        resultExhausted: boolean
    }
    unreadNotificationList: any[]
    showMoreIndex?: any
    unreadNotifications: number
    currentPage: number
    isLoading: boolean
    isReadExpanded: boolean
}

const defaultState: State = {
    readNotificationList: {
        notifications: [],
        resultExhausted: false,
    },
    unreadNotificationList: [],
    showMoreIndex: undefined,
    unreadNotifications: 0,
    currentPage: 0,
    isLoading: true,
    isReadExpanded: false,
}

const nextPage = () => (state: State) => ({
    ...state,
    currentPage: state.currentPage + 1,
})

// Updates notifications result state by either overwriting or appending
const handleNotificationResult = () => (state, newNotificationResult) => {
    const readNotificationList = {  
        ...newNotificationResult,
        notifications: [...state.readNotificationList.notifications, ...newNotificationResult.notifications],
    }

    return { ...state, readNotificationList }
}

const toggleExpand = () => state => ({
    ...state,
    isReadExpanded: !state.isReadExpanded,
})

const initState = <T>(key) => (state: State, payload: T) => ({
    ...state,
    [key]: payload,
})

const reducer = createReducer<State>({}, defaultState)

reducer.on(actions.setReadNotificationList, initState<boolean>('readNotificationList'))
reducer.on(actions.setUnreadNotificationList, initState<boolean>('unreadNotificationList'))
reducer.on(actions.setShowMoreIndex, initState<boolean>('showMoreIndex'))
reducer.on(actions.nextPage, nextPage())
reducer.on(actions.setLoading, initState<boolean>('isLoading'))
reducer.on(actions.appendReadNotificationResult, handleNotificationResult())
reducer.on(actions.toggleReadExpand, toggleExpand())

export default reducer
