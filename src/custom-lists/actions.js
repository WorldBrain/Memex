import { createAction } from 'redux-act'

import { updateLastActive } from 'src/analytics'
import { remoteFunction } from 'src/util/webextensionRPC'
import * as selectors from './selectors'

import { selectors as filters } from 'src/search-filters'

export const fetchAllLists = createAction('custom-lists/listData')
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
export const resetListDeleteModal = createAction(
    'custom-lists/resetListDeleteModal',
)
export const resetActiveListIndex = createAction(
    'custom-lists/resetActiveListIndex',
)
export const setActiveListIndex = createAction(
    'custom-lists/setActiveListIndex',
)

export const toggleListFilterIndex = createAction(
    'custom-lists/toggleListFilterIndex',
)

export const setUrlDragged = createAction('custom-lists/setUrlDragged')
export const resetUrlDragged = createAction('custom-lists/resetUrlDragged')
export const closeCreateListForm = createAction(
    'custom-lists/closeCreateListForm',
)
export const openCreateListForm = createAction(
    'custom-lists/openCreateListForm',
)
export const toggleCreateListForm = createAction(
    'custom-lists/toggleCreateListForm',
)
export const showCommonNameWarning = createAction(
    'custom-lists/showCommonNameWarning',
)
export const removeCommonNameWarning = createAction(
    'custom-lists/removeCommonNameWarning',
)

export const showEditBox = index => (dispatch, getState) => {
    const activeListIndex = selectors.activeListIndex(getState())
    if (activeListIndex === index) {
        dispatch(resetActiveListIndex())
    } else {
        dispatch(setActiveListIndex(index))
    }
}

export const delPageFromList = url => async (dispatch, getState) => {
    try {
        // const lists = await remoteFunction('fetchAllLists')()
        const index = selectors.listFilterIndex(getState())
        const listId = filters.listFilter(getState())
        await remoteFunction('removePageFromList')({
            id: Number(listId),
            url,
        })

        dispatch(hidePageFromList(url, index))
    } catch (err) {
        console.log(err)
    } finally {
        updateLastActive() // Consider user active
    }
}

export const getListFromDB = () => async (dispatch, getState) => {
    try {
        const lists = await remoteFunction('fetchAllLists')({})
        dispatch(fetchAllLists(lists || []))
    } catch (err) {
        console.log(err)
    } finally {
        updateLastActive() // Consider user active
    }
}

export const createPageList = (name, cb) => async (dispatch, getState) => {
    // gets id from DB after it is added

    try {
        // Create List
        const listExist = Boolean(
            await remoteFunction('fetchListIgnoreCase')({ name }),
        )

        if (!listExist) {
            // Gets the id of the created list for future reference
            const id = await remoteFunction('createCustomList')({ name })
            const list = {
                id,
                name,
                isDeletable: true,
                pages: [],
            }

            dispatch(createList(list))
            dispatch(closeCreateListForm())
            dispatch(removeCommonNameWarning())
            cb()
        } else {
            dispatch(showCommonNameWarning())
        }
    } catch (error) {
        console.log(error)
    } finally {
        updateLastActive() // consider user active.
    }
}

export const updateList = (index, name, id) => async (dispatch, getState) => {
    dispatch(resetActiveListIndex())
    try {
        await remoteFunction('updateListName')({ id, name })
        dispatch(updateListName(name, index))
    } catch (e) {
        console.log(e)
    } finally {
        updateLastActive() // consider user active.
    }
}

export const deletePageList = () => async (dispatch, getState) => {
    const { id, deleting } = selectors.deleteConfirmProps(getState())

    try {
        // DB call to remove List by ID.
        await remoteFunction('removeList')({ id })
    } catch (err) {
        console.log(err)
    } finally {
        dispatch(deleteList(id, deleting))
        dispatch(resetListDeleteModal())
        updateLastActive() // Consider user active
    }
}

export const addUrltoList = (url, index, id) => async (dispatch, getState) => {
    try {
        await remoteFunction('insertPageToList')({ id, url })
    } catch (e) {
        console.log(e)
    } finally {
        dispatch(addPagetoList(url, index))
        updateLastActive()
    }
}
