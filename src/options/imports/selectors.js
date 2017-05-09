import { createSelector } from 'reselect'

import { FILTERS, STATUS, DOC_SIZE_EST, DOC_TIME_EST, DOWNLOAD_TYPE as TYPE } from './constants'

export const entireState = state => state.imports

export const importStatus = state => entireState(state).importStatus
const indexRebuildingStatus = state => entireState(state).indexRebuildingStatus
export const downloadData = state => entireState(state).downloadData
const downloadDataFilter = state => entireState(state).downloadDataFilter
const fail = state => entireState(state).fail
const success = state => entireState(state).success
const totals = state => entireState(state).totals

const getImportStatusFlag = status => createSelector(
    importStatus,
    importStatus => importStatus === status,
)


// Main import state selectors
export const isInit = getImportStatusFlag(STATUS.INIT)
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

const getProgress = (success, fail, total) => ({ total, success, fail, complete: success + fail })

/**
 * Derives progress state from completed + total state counts.
 */
export const progress = createSelector(
    fail, success, totals,
    (fail, success, totals) => ({
        [TYPE.HISTORY]: getProgress(success[TYPE.HISTORY], fail[TYPE.HISTORY], totals[TYPE.HISTORY]),
        [TYPE.BOOKMARK]: getProgress(success[TYPE.BOOKMARK], fail[TYPE.BOOKMARK], totals[TYPE.BOOKMARK]),
    }),
)

// Util formatting functions for download time estimates
const getHours = time => Math.floor(time / 60).toFixed(0)
const getMins = time => (time - getHours(time) * 60).toFixed(0)
const getPaddedMins = time => getMins(time) < 10 ? `0${getMins(time)}` : getMins(time)
const getTimeEstStr = time => `${getHours(time)}:${getPaddedMins(time)} h`

const getEstimate = (success, fail, total) => {
    const complete = success + fail
    const remaining = total - complete
    return {
        complete,
        remaining,
        sizeCompleted: (complete * DOC_SIZE_EST).toFixed(2),
        sizeRemaining: (remaining * DOC_SIZE_EST).toFixed(2),
        timeRemaining: getTimeEstStr(remaining * DOC_TIME_EST),
    }
}

/**
 * Derives estimates state from completed + total state counts.
 */
export const estimates = createSelector(
    fail, success, totals,
    (fail, success, totals) => ({
        [TYPE.HISTORY]: getEstimate(success[TYPE.HISTORY], fail[TYPE.HISTORY], totals[TYPE.HISTORY]),
        [TYPE.BOOKMARK]: getEstimate(success[TYPE.BOOKMARK], fail[TYPE.BOOKMARK], totals[TYPE.BOOKMARK]),
    }),
)
