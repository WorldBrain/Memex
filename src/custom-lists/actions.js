import { createAction } from 'redux-act'

import { remoteFunction } from 'src/util/webextensionRPC'
import * as selectors from './selectors'
import * as resultActs from 'src/overview/results/actions'
import { selectors as filters } from 'src/search-filters'
import analytics from 'src/analytics'
import * as Raven from 'src/util/raven' // eslint-disable-line

export const fetchAllLists = createAction('custom-lists/listData')
export const createList = createAction('custom-lists/addList')
export const deleteList = createAction('custom-lists/deleteList', (id) => ({
    id,
}))
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

export const setShowCrowdFundingModal = createAction(
    'custom-lists/setShowCrowdFundingModal',
)

export const setUrlDragged = createAction(
    'custom-lists/setUrlDragged',
    (url) => url,
)
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

export const showEditBox = (index) => (dispatch, getState) => {
    const activeListIndex = selectors.activeListIndex(getState())
    if (activeListIndex === index) {
        dispatch(resetActiveListIndex())
    } else {
        dispatch(setActiveListIndex(index))
    }
}

export const delPageFromList = (url, isSocialPost) => async (
    dispatch,
    getState,
) => {
    try {
        const state = getState()
        const listId = filters.listFilter(state)
        const delPageFromListRPC = isSocialPost
            ? 'delPostFromList'
            : 'removePageFromList'

        await remoteFunction(delPageFromListRPC)({
            id: Number(listId),
            url,
        })
    } catch (err) {
        Raven.captureException(err)
    }
}

export const getListFromDB = ({ skipMobileList } = {}) => async (
    dispatch,
    getState,
) => {
    try {
        const lists = await remoteFunction('fetchAllLists')({
            limit: 1000,
            skipMobileList,
        })
        dispatch(fetchAllLists(lists || []))
    } catch (err) {
        Raven.captureException(err)
    }
}

export const createPageList = (name, cb) => async (dispatch, getState) => {
    // gets id from DB after it is added

    try {
        analytics.trackEvent({ category: 'Collections', action: 'create' })

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
    } catch (err) {
        Raven.captureException(err)
    }
}

export const updateList = ([oldName, newName], id) => async (
    dispatch,
    getState,
) => {
    dispatch(resetActiveListIndex())
    const lists = selectors.allLists(getState())
    const index = lists.findIndex((list) => list.name === oldName)

    if (index === -1) {
        return
    }

    try {
        await remoteFunction('updateListName')({ id, newName, oldName })

        dispatch(updateListName(newName, index))
        dispatch(resultActs.updateListName([oldName, newName]))
    } catch (err) {
        Raven.captureException(err)
    }
}

export const deletePageList = () => async (dispatch, getState) => {
    const { id } = selectors.deleteConfirmProps(getState())

    try {
        // DB call to remove List by ID.
        await remoteFunction('removeList')({ id })
    } catch (err) {
        Raven.captureException(err)
    } finally {
        dispatch(deleteList(id))
        dispatch(resetListDeleteModal())
    }
}

export const addUrltoList = (url, isSocialPost, index, id) => async (
    dispatch,
) => {
    const addPagetoListRPC = isSocialPost ? 'addPostToList' : 'insertPageToList'

    try {
        await remoteFunction(addPagetoListRPC)({ id, url })
    } catch (err) {
        Raven.captureException(err)
    } finally {
        dispatch(addPagetoList(url, index))
    }
}
