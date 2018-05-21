import { createReducer } from 'redux-act'

import * as actions from './actions'

const defaultState = {
    listCount: null,
    activeListIndex: -1,
    /** list will contain some data like
     * {
     *  id: Unique ID of the list
     *  listName: @[string],
     *  pages: [Array of urls].
     * }
     * 
     */
    lists: [],
    deleteConfirmProps: {
        isShown: false,
        id: undefined,
        // Used to keep track of any particular result (use index)
        deleting: undefined,
    },
}

const getAllLists = (state, lists) => ({
    ...state,
    lists,
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

const deleteList = (state, { id, index }) => ({
    ...state,
    lists: [...state.lists.slice(0, index), ...state.lists.slice(index + 1)],
})

const addPageToList = (state, { url, index }) => {
    // TODO: Maybe use id instead
    const list = state.lists[index]
    const newList = {
        ...list,
        pages: [...list.pages, { url }],
    }
    return {
        ...state,
        lists: [
            ...state.lists.slice(0, index),
            newList,
            ...state.lists.slice(index + 1),
        ],
    }
}

const showDeleteConfirm = (state, { id, index }) => {
    console.log(id, index)
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

const hideDeleteConfirm = state => ({
    ...state,
    deleteConfirmProps: {
        ...defaultState.deleteConfirmProps,
        deleting: state.deleteConfirmProps.deleting,
    },
})

const payloadReducer = key => (state, payload) => ({ ...state, [key]: payload })

export default createReducer(
    {
        [actions.getAllLists]: getAllLists,
        [actions.resetActiveListIndex]: state => ({
            ...state,
            activeListIndex: defaultState.activeListIndex,
        }),
        [actions.setActiveListIndex]: payloadReducer('activeListIndex'),
        [actions.createList]: createList,
        [actions.updateListName]: updateList,
        [actions.deleteList]: deleteList,
        [actions.addPagetoList]: addPageToList,
        [actions.showListDeleteModal]: showDeleteConfirm,
        [actions.hideListDeleteModal]: hideDeleteConfirm,
        [actions.resetListDeleteModal]: state => ({
            ...state,
            deleteConfirmProps: { ...defaultState.deleteConfirmProps },
        }),
    },
    defaultState,
)
