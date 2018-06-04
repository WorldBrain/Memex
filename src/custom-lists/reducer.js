import { createReducer } from 'redux-act'
import difference from 'lodash/fp/difference'
import union from 'lodash/fp/union'

import * as actions from './actions'

const defaultState = {
    listCount: null,
    activeListIndex: -1,
    listFilterIndex: null,
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
    listEditDropdown: false,
    urlsToEdit: [],
    tempLists: [],
    showAddToList: false,
}

const getAllLists = (state, lists) => ({
    ...state,
    lists,
    tempLists: lists,
})

const setTempLists = state => ({
    ...state,
    tempLists: state.lists,
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
    const { lists } = state
    const list = lists[index]

    if (list.pages.indexOf(url) > -1) return state

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

const hideDeleteConfirm = state => ({
    ...state,
    deleteConfirmProps: {
        ...defaultState.deleteConfirmProps,
        deleting: state.deleteConfirmProps.deleting,
    },
})

const payloadReducer = key => (state, payload) => ({ ...state, [key]: payload })

const toggleListFilterIndex = (state, index) => {
    const { listFilterIndex } = state
    if (listFilterIndex === null || listFilterIndex !== index) {
        return {
            ...state,
            listFilterIndex: index,
        }
    }

    return {
        ...state,
        listFilterIndex: null,
    }
}

const toggleUrlToEdit = (state, url) => {
    const { urlsToEdit } = state
    const index = urlsToEdit.indexOf(url)

    if (index > -1) {
        return {
            ...state,
            urlsToEdit: [
                ...urlsToEdit.slice(0, index),
                ...urlsToEdit.slice(index + 1),
            ],
        }
    }

    return {
        ...state,
        urlsToEdit: [...urlsToEdit, url],
    }
}

const bulkRemovePagesFromList = (state, id) => {
    const { urlsToEdit } = state
    const list = state.tempLists.find(x => x._id === id)
    const index = state.tempLists.indexOf(list)

    // difference returns Arr1 - Arr2 (all values of Arr2 removed from Arr1)
    return {
        ...state,
        tempLists: [
            ...state.tempLists.slice(0, index),
            {
                ...list,
                pages: difference(list.pages, urlsToEdit),
            },
            ...state.tempLists.slice(index + 1),
        ],
    }
}

const bulkAddPagesToList = (state, id) => {
    const { urlsToEdit } = state
    const list = state.tempLists.find(x => x._id === id)
    const index = state.tempLists.indexOf(list)

    // difference returns Arr1 - Arr2 (all values of Arr2 removed from Arr1)
    return {
        ...state,
        tempLists: [
            ...state.tempLists.slice(0, index),
            {
                ...list,
                pages: union(list.pages, urlsToEdit),
            },
            ...state.tempLists.slice(index + 1),
        ],
    }
}

const saveTempToLists = state => ({
    ...state,
    lists: state.tempLists,
})

const resetPagesinTempList = (state, id) => {
    const tempList = state.tempLists.find(x => x._id === id)
    const list = state.lists.find(x => x._id === id)
    const index = state.tempLists.indexOf(list)

    return {
        ...state,
        tempLists: [
            ...state.tempLists.slice(0, index),
            {
                ...tempList,
                pages: list.pages,
            },
            ...state.tempLists.slice(index + 1),
        ],
    }
}

const toggleAddToList = state => ({
    ...state,
    showAddToList: !state.showAddToList,
})

const closeAddToList = state => ({
    ...state,
    showAddToList: false,
})

const resetUrlToEdit = state => ({
    ...state,
    urlsToEdit: [],
})

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
        [actions.toggleListFilterIndex]: toggleListFilterIndex,
        [actions.resetListDeleteModal]: state => ({
            ...state,
            deleteConfirmProps: { ...defaultState.deleteConfirmProps },
        }),
        [actions.toggleListDropdown]: state => ({
            ...state,
            listEditDropdown: !state.listEditDropdown,
        }),
        [actions.toggleUrlToEdit]: toggleUrlToEdit,
        [actions.bulkAddPagesToList]: bulkAddPagesToList,
        [actions.bulkRemovePagesFromList]: bulkRemovePagesFromList,
        [actions.applyBulkEdits]: saveTempToLists,
        [actions.resetPagesinTempList]: resetPagesinTempList,
        [actions.setTempLists]: setTempLists,
        [actions.toggleAddToList]: toggleAddToList,
        [actions.closeAddToList]: closeAddToList,
        [actions.resetUrlToEdit]: resetUrlToEdit,
    },
    defaultState,
)
