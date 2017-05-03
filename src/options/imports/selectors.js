import { createSelector } from 'reselect'

export const entireState = state => state.imports

const loadingStatus = state => entireState(state).loadingStatus
const indexRebuildingStatus = state => entireState(state).indexRebuildingStatus

export const isLoading = createSelector(
    loadingStatus,
    indexRebuildingStatus,
    (loadingStatus, indexRebuildingStatus) =>
        loadingStatus === 'pending' || indexRebuildingStatus === 'pending',
)

export const isPaused = createSelector(
    loadingStatus,
    loadingStatus => loadingStatus === 'paused',
)

export const isCheckboxDisabled = createSelector(
    loadingStatus,
    loadingStatus => loadingStatus !== 'stopped',
)
