import { createSelector } from 'reselect'

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

export const getSortedLists = createSelector(getAllLists, lists => {
    return lists.sort(function(a, b) {
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return 0
    })
})

export const results = createSelector(
    getSortedLists,
    activeListIndex,
    (lists, listIndex) =>
        lists.map((pageDoc, i) => ({
            ...pageDoc,
            isEditing: i === listIndex,
        })),
)
