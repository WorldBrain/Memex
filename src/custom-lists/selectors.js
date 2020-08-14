import { createSelector } from 'reselect'
import { MOBILE_LIST_NAME } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/constants'

import * as selectors from '../search-filters/selectors'

export const customLists = (state) => state.customLists

export const allLists = createSelector(customLists, (state) => state.lists)
export const activeListIndex = createSelector(
    customLists,
    (state) => state.activeListIndex,
)

export const listFilterIndex = createSelector(
    customLists,
    (state) => state.listFilterIndex,
)

export const getSortedLists = createSelector(allLists, (lists) => {
    const mobileListIndex = lists.findIndex(
        ({ name }) => name === MOBILE_LIST_NAME,
    )

    if (mobileListIndex === -1) {
        return [{ name: MOBILE_LIST_NAME, id: -1 }, ...lists]
    }

    return lists
})

export const getUrlsToEdit = createSelector(
    customLists,
    (state) => state.urlsToEdit,
)

export const results = createSelector(
    getSortedLists,
    activeListIndex,
    selectors.listFilter,
    (lists, listIndex, listFilter) => {
        return lists.map((pageDoc, i) => ({
            ...pageDoc,
            isEditing: i === listIndex,
            isFilterIndex: Number(listFilter) === pageDoc.id,
            isMobileList: pageDoc.name === MOBILE_LIST_NAME,
        }))
    },
)

export const deleteConfirmProps = createSelector(
    customLists,
    (state) => state.deleteConfirmProps,
)

export const isDeleteConfShown = createSelector(
    deleteConfirmProps,
    (state) => state.isShown,
)

export const shareModalProps = createSelector(
    customLists,
    (state) => state.shareModalProps,
)

export const deletingIndex = createSelector(
    deleteConfirmProps,
    (state) => state.deleting,
)

export const deletingID = createSelector(
    deleteConfirmProps,
    (state) => state.id,
)

export const listEditDropdown = createSelector(
    customLists,
    (state) => state.listEditDropdown,
)

export const showAddToList = createSelector(
    customLists,
    (state) => state.showAddToList,
)

export const urlDragged = createSelector(
    customLists,
    (state) => state.urlDragged,
)

export const showCreateListForm = createSelector(
    customLists,
    (state) => state.showCreateListForm,
)

export const showCommonNameWarning = createSelector(
    customLists,
    (state) => state.showCommonNameWarning,
)

export const showCrowdFundingModal = createSelector(
    customLists,
    (state) => state.showCrowdFundingModal,
)

export const activeCollectionName = createSelector(
    selectors.listFilter,
    allLists,
    (listFilterId, lists) =>
        listFilterId
            ? lists
                  .filter((list) => list.id === Number(listFilterId))
                  .map((list) => list.name)[0]
            : undefined,
)
