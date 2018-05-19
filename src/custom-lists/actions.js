import { createAction } from 'redux-act'
import * as selectors from './selectors'
// import constants from './constants'
// import { overview } from '../overview/selectors';

import dummyData from './dummy-data/index'

export const getAllLists = createAction('overview/listData')
export const updatePageLists = createAction('overview/updateList')
export const createList = createAction('overview/addList')
export const deleteList = createAction('overview/deleteList')
export const updateListName = createAction(
    'overview/updateListName',
    (value, index) => ({
        value,
        index,
    }),
)

export const addPagetoList = createAction('overview/addPagetoList')
export const removePageFromList = createAction('overview/removePageFromList')
// TODO: change names
export const hideDeleteConfirm = createAction('overview/hideDeleteConfirm')
export const resetDeleteConfirm = createAction('overview/resetDeleteConfirm')
export const resetActiveListIndex = createAction(
    'overview/resetActiveListIndex',
)
export const setActiveListIndex = createAction('overview/setActiveListIndex')

// returns instance of ListStorageHandler class
export const listStorage = () => (dispatch, getState) =>
    new ListStorageHandler(dispatch, getState)

export const showEditBox = index => (dispatch, getState) => {
    const activeListIndex = selectors.activeListIndex(getState())
    if (activeListIndex === index) {
        dispatch(resetActiveListIndex())
    } else {
        dispatch(setActiveListIndex(index))
    }
}

export default class ListStorageHandler {
    constructor(dispatch, getState) {
        this._dispatch = dispatch
        this._getState = getState
    }

    async getListFromDB() {
        this._dispatch(getAllLists(dummyData))
    }

    async createList(event) {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        const list = {
            _id: null,
            name: value,
            isDeletable: true,
            pages: [],
        }
        this._dispatch(createList(list))
    }

    getListById() {}

    delListById() {}

    updateList = index => event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        this._dispatch(resetActiveListIndex())
        this._dispatch(updateListName(value, index))
    }

    addPagetoList() {}

    delPageFromList() {}
}
