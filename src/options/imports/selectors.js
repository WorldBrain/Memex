import { createSelector } from 'reselect'

import { FILTERS } from './constants'

export const entireState = state => state.imports

const loadingStatus = state => entireState(state).loadingStatus
const indexRebuildingStatus = state => entireState(state).indexRebuildingStatus
const downloadData = state => entireState(state).downloadData
const downloadDataFilter = state => entireState(state).downloadDataFilter
export const historyProgress = state => entireState(state).historyProgress
export const bookmarksProgress = state => entireState(state).bookmarksProgress
export const historyStats = state => entireState(state).historyStats
export const bookmarksStats = state => entireState(state).bookmarksStats

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

export const isStopped = createSelector(
    isPaused,
    isLoading,
    (isPaused, isLoading) => !isPaused && !isLoading,
)

export const isCheckboxDisabled = createSelector(
    loadingStatus,
    loadingStatus => loadingStatus !== 'stopped',
)

/**
 * Derives ready-to-use download details data (rendered into rows).
 * Performs a filter depending on the current projection selected in UI,
 * as well as map from store data to UI data.
 */
export const downloadDetailsData = createSelector(
    downloadData,
    downloadDataFilter,
    (downloadData, filter) => downloadData.filter(({ status }) => {
        if (filter === FILTERS.ALL) {
            return true
        }
        if (filter === FILTERS.FAIL) {
            return !status
        }
        return status
    }).map(({ url, status, err }) => ({
        url,
        downloaded: status ? 'Success' : 'Failed',
        error: err,
    })),
)
