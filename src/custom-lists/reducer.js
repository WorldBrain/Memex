import { createReducer } from 'redux-act'

import * as actions from './actions'

/**
 *
 * @typedef {Object} Lists
 * @property {number} id
 * @property {name} string - Indicates name of the list.
 * @property {boolean} isDeletable - Indicates if the list can be deleted.
 * @property {boolean} isNestable - Indicates if list can be nested.
 * @property {string[]} pages- Indicates pages contained in the list.
 */

// TODO: complete this.

/**
 *
 * @typedef {Object} ListState
 * @property {number} activeListIndex
 * @property {number} listFilterIndex
 * @property {Lists[]} lists
 * @property {string} urlDragged
 * @property {boolean} showCommonNameWarning
 * @property {boolean} showCreateListForm
 */

const defaultState = {
    activeListIndex: -1,
    listFilterIndex: null,
    lists: [],
    deleteConfirmProps: {
        isShown: false,
        id: undefined,
        // Used to keep track of any particular result (use index)
        deleting: undefined,
    },
    urlDragged: '',
    showCreateListForm: false,
    showCommonNameWarning: false,
    showCrowdFundingModal: false,
    inboxUnreadCount: 0,
    shareModalProps: {
        isShown: false,
        index: undefined,
    },
}

const fetchAllLists = (state, lists) => ({
    ...state,
    lists,
    tempLists: lists,
})

const createList = (state, list) => ({
    ...state,
    lists: [...state.lists, list],
})

const updateList = (state, { value, index }) => ({
    ...state,
    lists: [
        ...state.lists.slice(0, index),
        {
            ...state.lists[index],
            name: value,
        },
        ...state.lists.slice(index + 1),
    ],
})

const deleteList = (state, { id }) => ({
    ...state,
    lists: [...state.lists.filter((list) => list.id !== id)],
})

const addPageToList = (state, { url, index }) => {
    const { lists } = state
    const list = lists[index]

    if (list.pages.includes(url)) {
        return state
    }

    const newList = {
        ...list,
        pages: [...list.pages, url],
    }

    return {
        ...state,
        lists: [...lists.slice(0, index), newList, ...lists.slice(index + 1)],
    }
}

const showDeleteConfirm = (state, { id, index }) => {
    return {
        ...state,
        deleteConfirmProps: {
            ...state.deleteConfirmProps,
            isShown: true,
            id,
            deleting: index,
        },
    }
}

const payloadReducer = (key) => (state, payload) => ({
    ...state,
    [key]: payload,
})

const setUrlDragged = (state, url) => {
    return {
        ...state,
        urlDragged: url,
    }
}

const setShowCrowdFundingModal = (state, value) => {
    return {
        ...state,
        showCrowdFundingModal: value,
    }
}

const resetUrlDragged = (state) => {
    return {
        ...state,
        urlDragged: '',
    }
}

const openCreateListForm = (state) => ({
    ...state,
    showCreateListForm: true,
})

const closeCreateListForm = (state) => ({
    ...state,
    showCreateListForm: false,
})

const toggleCreateListForm = (state) => ({
    ...state,
    showCreateListForm: !state.showCreateListForm,
})

const showCommonNameWarning = (state) => ({
    ...state,
    showCommonNameWarning: true,
})

const removeCommonNameWarning = (state) => ({
    ...state,
    showCommonNameWarning: false,
})

export default createReducer(
    {
        [actions.fetchAllLists]: fetchAllLists,
        [actions.resetActiveListIndex]: (state) => ({
            ...state,
            activeListIndex: defaultState.activeListIndex,
        }),
        [actions.setActiveListIndex]: payloadReducer('activeListIndex'),
        [actions.createList]: createList,
        [actions.updateListName]: updateList,
        [actions.deleteList]: deleteList,
        [actions.addPagetoList]: addPageToList,
        [actions.showListDeleteModal]: showDeleteConfirm,
        [actions.resetListDeleteModal]: (state) => ({
            ...state,
            deleteConfirmProps: { ...defaultState.deleteConfirmProps },
        }),
        [actions.setUrlDragged]: setUrlDragged,
        [actions.resetUrlDragged]: resetUrlDragged,
        [actions.openCreateListForm]: openCreateListForm,
        [actions.closeCreateListForm]: closeCreateListForm,
        [actions.toggleCreateListForm]: toggleCreateListForm,
        [actions.showCommonNameWarning]: showCommonNameWarning,
        [actions.removeCommonNameWarning]: removeCommonNameWarning,
        [actions.setShowCrowdFundingModal]: setShowCrowdFundingModal,
        [actions.setInboxUnreadCount]: (state, inboxUnreadCount) => ({
            ...state,
            inboxUnreadCount,
        }),
        [actions.decInboxUnreadCount]: (state) => ({
            ...state,
            inboxUnreadCount: state.inboxUnreadCount - 1,
        }),
    },
    defaultState,
)
