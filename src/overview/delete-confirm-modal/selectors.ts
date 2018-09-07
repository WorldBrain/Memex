import { createSelector } from 'reselect'

import { RootState } from '../../options/types'

const deleteConfModal = (state: RootState) => state.deleteConfModal

export const isShown = createSelector(deleteConfModal, state => state.isShown)
export const urlToDelete = createSelector(deleteConfModal, state => state.url)
export const indexToDelete = createSelector(
    deleteConfModal,
    state => state.deleteIndex,
)
