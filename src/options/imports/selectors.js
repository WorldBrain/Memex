import { createSelector } from 'reselect'

import { FILTERS, STATUS, DOWNLOAD_TYPE as TYPE } from './constants'

export const entireState = state => state.imports

const loadingStatus = state => entireState(state).loadingStatus
const indexRebuildingStatus = state => entireState(state).indexRebuildingStatus
const downloadData = state => entireState(state).downloadData
const downloadDataFilter = state => entireState(state).downloadDataFilter
export const historyStats = state => entireState(state).historyStats
export const bookmarksStats = state => entireState(state).bookmarksStats
const historyTimeEst = state => historyStats(state).timeEstim
const bookmarksTimeEst = state => bookmarksStats(state).timeEstim

export const isLoading = createSelector(
    loadingStatus,
    indexRebuildingStatus,
    (loadingStatus, indexRebuildingStatus) =>
        loadingStatus === STATUS.RUNNING || indexRebuildingStatus === STATUS.RUNNING,
)

export const isPaused = createSelector(
    loadingStatus,
    loadingStatus => loadingStatus === STATUS.PAUSED,
)

export const isStopped = createSelector(
    isPaused,
    isLoading,
    (isPaused, isLoading) => !isPaused && !isLoading,
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

/**
 * Calculates the progress table data from the actual data.
 */
const calcProgress = ({ saved, notDownloaded }, data) => {
    const progress = data.length
    const successful = data.filter(({ status }) => status).length

    return {
        total: saved + notDownloaded,
        failed: progress - successful,
        progress,
        successful,
    }
}

const historyDownloadData = createSelector(
    downloadData,
    data => data.filter(({ type }) => type === TYPE.HISTORY),
)

const bookmarksDownloadData = createSelector(
    downloadData,
    data => data.filter(({ type }) => type === TYPE.BOOKMARK),
)

export const historyProgress = createSelector(
    historyStats,
    historyDownloadData,
    calcProgress,
)

export const bookmarksProgress = createSelector(
    bookmarksStats,
    bookmarksDownloadData,
    calcProgress,
)

// Util formatting functions for download time estimates
const getHours = time => Math.floor(time / 60)
const getMins = time => time - getHours(time) * 60
const getPaddedMins = time => getMins(time) < 10 ? `0${getMins(time)}` : getMins(time)
const getTimeEstStr = time => `${getHours(time)}:${getPaddedMins(time)} h`

/**
 * Selects timeEstims from bookmarks/history stats as human-readable strings
 */
export const downloadTimeEstimates = createSelector(
    historyTimeEst,
    bookmarksTimeEst,
    (history, bookmarks) => ({
        history: getTimeEstStr(history),
        bookmarks: getTimeEstStr(bookmarks),
    }),
)
