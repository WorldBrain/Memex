import { createSelector } from 'reselect'
// import { selectors } from '../search-filters'
// TODO: check why not working the other way around.
import * as selectors from '../search-filters/selectors'
// import { selectors as filters } from '../overview/filters'

// TODO: Needs some work.
const sortAlphabetically = (a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
    return 0
}

export const customLists = state => state.customLists

export const fetchAllLists = createSelector(customLists, state => state.lists)
export const getListCount = createSelector(
    customLists,
    state => state.listCount,
)
export const activeListIndex = createSelector(
    customLists,
    state => state.activeListIndex,
)

export const listFilterIndex = createSelector(
    customLists,
    state => state.listFilterIndex,
)

export const getSortedLists = createSelector(fetchAllLists, lists => {
    return lists.sort(sortAlphabetically)
})

export const getUrlsToEdit = createSelector(
    customLists,
    state => state.urlsToEdit,
)

export const results = createSelector(
    getSortedLists,
    activeListIndex,
    selectors.listFilter,
    // getUrlsToEdit,
    (lists, listIndex, listFilter) => {
        return lists.map((pageDoc, i) => ({
            ...pageDoc,
            isEditing: i === listIndex,
            isFilterIndex: Number(listFilter) === pageDoc.id,
        }))
    },
)

export const deleteConfirmProps = createSelector(
    customLists,
    state => state.deleteConfirmProps,
)
export const isDeleteConfShown = createSelector(
    deleteConfirmProps,
    state => state.isShown,
)

export const getDeletingIndex = createSelector(
    deleteConfirmProps,
    state => state.deleting,
)

export const getDeletingID = createSelector(
    deleteConfirmProps,
    state => state.id,
)

export const listEditDropdown = createSelector(
    customLists,
    state => state.listEditDropdown,
)

export const showAddToList = createSelector(
    customLists,
    state => state.showAddToList,
)

export const getUrlDragged = createSelector(
    customLists,
    state => state.urlDragged,
)

export const showCreateListForm = createSelector(
    customLists,
    state => state.showCreateListForm,
)

export const showCommonNameWarning = createSelector(
    customLists,
    state => state.showCommonNameWarning,
)
