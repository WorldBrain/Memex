import { createSelector } from 'reselect'
import pickBy from 'lodash/fp/pickBy'

import {
    FILTERS,
    STATUS,
    DOC_SIZE_EST,
    DOC_TIME_EST,
    IMPORT_TYPE as TYPE,
    DOWNLOAD_STATUS as DL_STAT,
} from './constants'

export const entireState = state => state.imports

export const importStatus = state => entireState(state).importStatus
export const downloadData = state => entireState(state).downloadData
export const downloadDataFilter = state => entireState(state).downloadDataFilter
export const fail = state => entireState(state).fail
export const success = state => entireState(state).success
export const totals = state => entireState(state).totals
const completed = state => entireState(state).completed
export const allowTypes = state => entireState(state).allowTypes
export const loadingMsg = state => entireState(state).loadingMsg

export const showDownloadDetails = state =>
    entireState(state).showDownloadDetails
// Dev features only
export const devState = createSelector(entireState, state => state.dev)
export const devMode = createSelector(devState, devState => devState.isEnabled)
export const isUploading = createSelector(
    devState,
    devState => devState.isUploading,
)

const getImportStatusFlag = status =>
    createSelector(importStatus, importStatus => importStatus === status)

// Main import state selectors
export const isLoading = getImportStatusFlag(STATUS.LOADING)
export const isIdle = getImportStatusFlag(STATUS.IDLE)
export const isRunning = getImportStatusFlag(STATUS.RUNNING)
export const isPaused = getImportStatusFlag(STATUS.PAUSED)
export const isStopped = getImportStatusFlag(STATUS.STOPPED)

/**
 * Derives ready-to-use download details data (rendered into rows).
 * Performs a filter depending on the current projection selected in UI,
 * as well as map from store data to UI data.
 */
export const downloadDetailsData = createSelector(
    downloadData,
    downloadDataFilter,
    (downloadData, filter) =>
        downloadData
            .filter(({ status }) => {
                switch (filter) {
                    case FILTERS.SUCC:
                        return status !== DL_STAT.FAIL
                    case FILTERS.FAIL:
                        return status === DL_STAT.FAIL
                    case FILTERS.ALL:
                    default:
                        return true
                }
            })
            .map(({ url, status, error }) => ({
                url,
                downloaded: status,
                error,
            })),
)

const getProgress = (success, fail, total, allow) => ({
    total: allow ? total : 0,
    success,
    fail,
    complete: success + fail,
})

/**
 * Derives progress state from completed + total state counts.
 */
export const progress = createSelector(
    success,
    fail,
    totals,
    allowTypes,
    (...args) => ({
        [TYPE.HISTORY]: getProgress(...args.map(arg => arg[TYPE.HISTORY])),
        [TYPE.BOOKMARK]: getProgress(...args.map(arg => arg[TYPE.BOOKMARK])),
        [TYPE.OLD]: getProgress(...args.map(arg => arg[TYPE.OLD])),
    }),
)

// Util formatting functions for download time estimates
const getHours = time => Math.floor(time / 60).toFixed(0)
const getMins = time => (time - getHours(time) * 60).toFixed(0)
const getPaddedMins = time =>
    getMins(time) < 10 ? `0${getMins(time)}` : getMins(time)
const getTimeEstStr = time => `${getHours(time)}:${getPaddedMins(time)} h`

const getEstimate = (complete, remaining) => ({
    complete,
    remaining,
    sizeCompleted: (complete * DOC_SIZE_EST).toFixed(2),
    sizeRemaining: (remaining * DOC_SIZE_EST).toFixed(2),
    timeRemaining: getTimeEstStr(remaining * DOC_TIME_EST),
})

/**
 * Derives estimates state from completed + total state counts.
 */
export const estimates = createSelector(
    completed,
    totals,
    (completed, totals) => ({
        [TYPE.HISTORY]: getEstimate(
            completed[TYPE.HISTORY],
            totals[TYPE.HISTORY],
        ),
        [TYPE.BOOKMARK]: getEstimate(
            completed[TYPE.BOOKMARK],
            totals[TYPE.BOOKMARK],
        ),
        [TYPE.OLD]: getEstimate(completed[TYPE.OLD], totals[TYPE.OLD]),
    }),
)

export const isStartBtnDisabled = createSelector(
    allowTypes,
    estimates,
    (allowTypes, estimates) => {
        const pickByAllowedTypes = pickBy((val, key) => val)
        const allCheckboxesDisabled = () =>
            !Object.values(allowTypes).reduce((prev, curr) => prev || curr)

        // Map-reduce the remaining (allowed) estimates to disable button when remaining is 0
        const noImportsRemaining = () =>
            Object.keys(pickByAllowedTypes(allowTypes))
                .map(importType => estimates[importType].remaining === 0)
                .reduce((prev, curr) => prev && curr)

        return allCheckboxesDisabled() || noImportsRemaining()
    },
)
