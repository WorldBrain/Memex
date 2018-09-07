import { createSelector } from 'reselect'

import { RootState } from '../types'

const blacklistBtn = (state: RootState) => state.blacklistBtn

export const showBlacklistChoice = createSelector(
    blacklistBtn,
    state => state.showDomainChoice,
)

export const isBlacklisted = createSelector(
    blacklistBtn,
    state => state.isBlacklisted,
)

export const domainDelete = createSelector(
    blacklistBtn,
    state => state.domainDelete,
)

export const showDeleteConfirm = createSelector(
    blacklistBtn,
    state => state.showDeleteConfirm,
)
