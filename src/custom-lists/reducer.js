import { createReducer } from 'redux-act'
// import update from 'lodash/fp/update'
// import remove from 'lodash/fp/remove'

import * as actions from './actions'

const defaultState = {
    listCount: null,
    activeListIndex: -1,
    /** list will contain some data like
     * {
     *  listName: @[string],
     *  pages: [Array of urls].
     * }
     * 
     */
    lists: [],
    deleteConfirmProps: {
        isShown: false,
        url: undefined,
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

const deleteList = (state, index) => {}

// const showDeleteConfirm = () => { }

// const hideDeleteConfirm = () => { }

const addPageToList = (state, { url, index }) => {
    // TODO: Maybe an use id instead
    const doc = state.lists[index]
    const docs = [
        ...state.lists.slice(0, index),
        {
            ...doc,
            pageUrls: [...doc.pageUrls, url],
        },
        ...state.searchResult.docs.slice(index + 1),
    ]

    return {
        ...state,
        lists: {
            ...state.lists,
            docs,
        },
    }
}
// TODO: Change all the following functions
// const deletePageFromList = (state, index) => { }
const deletePageFromList = (state, { tag, index }) => {
    const doc = state.searchResult.docs[index]
    const removalIndex = doc.tags.findIndex(val => val === tag)
    if (removalIndex === -1) {
        return state
    }

    const docs = [
        ...state.searchResult.docs.slice(0, index),
        {
            ...doc,
            tags: [
                ...doc.tags.slice(0, removalIndex),
                ...doc.tags.slice(removalIndex + 1),
            ],
        },
        ...state.searchResult.docs.slice(index + 1),
    ]

    return {
        ...state,
        searchResult: {
            ...state.searchResult,
            docs,
        },
    }
}

const showDeleteConfirm = (state, { url, index }) => ({
    ...state,
    deleteConfirmProps: {
        ...state.deleteConfirmProps,
        isShown: true,
        url,
        deleting: index,
    },
})

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
        [actions.removePageFromList]: deletePageFromList,
        [actions.showDeleteConfirm]: showDeleteConfirm,
        [actions.hideDeleteConfirm]: hideDeleteConfirm,
    },
    defaultState,
)
