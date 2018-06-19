import { createSelector } from 'reselect'
import difference from 'lodash/fp/difference'

import { selectors as filters } from 'src/overview/filters'

// TODO: Needs some work.
const sortAlphabetically = (a, b) => {
    if (
        typeof a === 'string' &&
        typeof b === 'string' &&
        a.name.toLowerCase() < b.name.toLowerCase()
    )
        return -1
    if (
        typeof a === 'string' &&
        typeof b === 'string' &&
        a.name.toLowerCase() > b.name.toLowerCase()
    )
        return 1
    return 0
}

export const customLists = state => state.customLists

export const getAllLists = createSelector(customLists, state => state.lists)
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

export const getSortedLists = createSelector(getAllLists, lists => {
    return lists.sort(sortAlphabetically)
})

export const getUrlsToEdit = createSelector(
    customLists,
    state => state.urlsToEdit,
)

// Will determine if all/some/none pages are on the list.
const getListUrlState = (lists, urlsToEdit) => {
    const { pages } = lists
    let pagesLen = 0
    // TODO: TEMPORARY CHECK UNTIL PAGES NOT ADDED TO LIST.
    if (pages) pagesLen = pages.length
    const editLen = urlsToEdit.length

    if (editLen === 0 || pagesLen === 0) return 'none'

    const diff = difference(pages, urlsToEdit)
    const diffLen = diff.length
    if (diffLen === 0 && pagesLen >= editLen) return 'all'
    else if (diffLen === pagesLen) return 'none'

    return 'some'
}

export const results = createSelector(
    getSortedLists,
    activeListIndex,
    filters.listFilter,
    // TODO: Come up with a good name
    getUrlsToEdit,
    (lists, listIndex, listFilter, urlsToEdit) =>
        lists.map((pageDoc, i) => ({
            ...pageDoc,
            isEditing: i === listIndex,
            isFilterIndex: listFilter === pageDoc.id,
            listUrlState: getListUrlState(pageDoc, urlsToEdit),
        })),
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
