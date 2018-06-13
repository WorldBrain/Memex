import { createAction } from 'redux-act'

import { updateLastActive } from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as selectors from './selectors'

// import constants from './constants'
// import { custom-lists } from '../custom-lists/selectors';

import dummyData from './dummy-data/index'
// // import { selectors as filters } from 'src/overview/filters'

export const getAllLists = createAction('custom-lists/listData')
export const updatePageLists = createAction('custom-lists/updateList')
export const createList = createAction('custom-lists/addList')
export const deleteList = createAction(
    'custom-lists/deleteList',
    (id, index) => ({
        id,
        index,
    }),
)
export const updateListName = createAction(
    'custom-lists/updateListName',
    (value, index) => ({
        value,
        index,
    }),
)

export const addPagetoList = createAction(
    'custom-lists/addPagetoList',
    (url, index) => ({
        url,
        index,
    }),
)
export const hidePageFromList = createAction('custom-lists/hidePageFromList')
export const showListDeleteModal = createAction(
    'custom-lists/showListDeleteModal',
    (id, index) => ({
        id,
        index,
    }),
)
export const hideListDeleteModal = createAction(
    'custom-lists/hideListDeleteModal',
)
export const resetListDeleteModal = createAction(
    'custom-lists/resetListDeleteModal',
)
export const resetActiveListIndex = createAction(
    'custom-lists/resetActiveListIndex',
)
export const setActiveListIndex = createAction(
    'custom-lists/setActiveListIndex',
)
export const toggleListDropdown = createAction(
    'custom-lists/toggleListDropdown',
)

export const toggleUrlToEdit = createAction('custom-lists/toggleUrlToEdit')

export const resetUrlToEdit = createAction('custom-lists/resetUrlToEdit')

export const toggleListFilterIndex = createAction(
    'custom-lists/toggleListFilterIndex',
)

// TODO: (imp) Replace two add with just one add action.
export const bulkAddPagesToList = createAction(
    'custom-lists/bulkAddPagesToList',
)

export const bulkRemovePagesFromList = createAction(
    'custom-lists/bulkRemovePagesFromList',
)

export const applyBulkEdits = createAction('custom-lists/applyBulkEdits')

export const resetPagesinTempList = createAction(
    'custom-lists/resetPagesinTempList',
)

export const setTempLists = createAction('custom-lists/setTempLists')

export const toggleAddToList = createAction('custom-lists/toggleAddToList')

export const closeAddToList = createAction('custom-lists/closeAddToList')

export const setUrlDragged = createAction('custom-lists/setUrlDragged')

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

export const delPageFromList = doc => async (dispatch, getState) => {
    const index = selectors.listFilterIndex(getState())
    dispatch(hidePageFromList(doc.url, index))
}

export const getListFromDB = () => async (dispatch, getState) => {
    dispatch(getAllLists(dummyData))
}

export const createPageList = name => async (dispatch, getState) => {
    // gets id from DB after it is added
    // TODO: add id
    const list = {
        _id: null,
        name,
        isDeletable: true,
        pages: [],
    }

    try {
        // Create List
        await remoteFunction('createCustomList')({ name })
        dispatch(createList(list))
    } catch (error) {
        console.log(error)
    } finally {
        updateLastActive() // consider user active.
    }
}

export const updateList = (index, name, id) => async (dispatch, getState) => {
    dispatch(resetActiveListIndex())
    dispatch(updateListName(name, index))
}

export const deletePageList = () => async (dispatch, getState) => {
    const { id, deleting } = selectors.deleteConfirmProps(getState())
    dispatch(deleteList(id, deleting))
    dispatch(resetListDeleteModal())
}

export const addUrltoList = (url, index, id) => async (dispatch, getState) => {
    dispatch(addPagetoList(url, index))
}

export const handleToggleAddToList = () => (dispatch, getState) => {
    dispatch(applyBulkEdits())
    dispatch(toggleAddToList())
}

// TODO: Remove this class after checking.
export default class ListStorageHandler {
    constructor(dispatch, getState) {
        this._dispatch = dispatch
        this._getState = getState
    }

    async getListFromDB() {
        this._dispatch(getAllLists(dummyData))
    }

    getListById() {}

    delListById() {}

    // TODO:  Make these 3 functions more general. :
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

    updateList = index => async event => {
        event.preventDefault()
        const { value } = event.target.elements['listName']
        this._dispatch(resetActiveListIndex())
        this._dispatch(updateListName(value, index))
    }

    deleteList = () => event => {
        event.preventDefault()
        const { id, deleting } = selectors.deleteConfirmProps(this._getState())
        this._dispatch(deleteList(id, deleting))
        this._dispatch(resetListDeleteModal())
    }

    addPagetoList = (_id, index) => url => {
        this._dispatch(addPagetoList(url, index))
    }

    delPageFromList() {}
}
