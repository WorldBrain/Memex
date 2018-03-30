import { createSelector } from 'reselect'
import pickBy from 'lodash/fp/pickBy'

import {
    FILTERS,
    STATUS,
    DOC_TIME_EST,
    IMPORT_TYPE as TYPE,
    IMPORT_TYPE_DISPLAY as TYPE_DISPLAY,
    DOWNLOAD_STATUS as DL_STAT,
} from './constants'

export const imports = state => state.imports

export const importStatus = createSelector(imports, state => state.importStatus)
export const downloadData = createSelector(imports, state => state.downloadData)
export const downloadDataFilter = createSelector(
    imports,
    state => state.downloadDataFilter,
)
export const fail = createSelector(imports, state => state.fail)
export const success = createSelector(imports, state => state.success)
export const totals = createSelector(imports, state => state.totals)
const completed = createSelector(imports, state => state.completed)
export const allowTypes = createSelector(imports, state => state.allowTypes)
export const loadingMsg = createSelector(imports, state => state.loadingMsg)

/**
 * Currently only used for analytics; derive the import type from `allowTypes` state
 */
export const allowTypesString = createSelector(allowTypes, state => {
    const val = []

    for (const type in state) {
        if (state[type]) {
            val.push(TYPE_DISPLAY[type])
        }
    }

    return val.join('+')
})

export const showDownloadDetails = createSelector(
    imports,
    state => state.showDownloadDetails,
)

// Adv settings mode
export const advMode = createSelector(imports, state => state.isAdvEnabled)
export const isUploading = createSelector(
    imports,
    state => state.isFileUploading,
)
export const concurrency = createSelector(imports, state => state.concurrency)
export const processErrors = createSelector(
    imports,
    state => state.processErrors,
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
            .reverse()
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

export const successCount = createSelector(
    progress,
    allowTypes,
    (progress, allowTypes) =>
        (allowTypes.h ? progress[TYPE.HISTORY].success : 0) +
        (allowTypes.b ? progress[TYPE.BOOKMARK].success : 0) +
        (allowTypes.o ? progress[TYPE.OLD].success : 0),
)

export const failCount = createSelector(
    progress,
    allowTypes,
    (progress, allowTypes) =>
        (allowTypes.h ? progress[TYPE.HISTORY].fail : 0) +
        (allowTypes.b ? progress[TYPE.BOOKMARK].fail : 0) +
        (allowTypes.o ? progress[TYPE.OLD].fail : 0),
)

export const progressPercent = createSelector(
    progress,
    allowTypes,
    (progress, allowTypes) => {
        const total =
            (allowTypes.h ? progress[TYPE.HISTORY].total : 0) +
            (allowTypes.b ? progress[TYPE.BOOKMARK].total : 0) +
            (allowTypes.o ? progress[TYPE.OLD].total : 0)
        const complete =
            (allowTypes.h ? progress[TYPE.HISTORY].complete : 0) +
            (allowTypes.b ? progress[TYPE.BOOKMARK].complete : 0) +
            (allowTypes.o ? progress[TYPE.OLD].complete : 0)

        return complete / total * 100
    },
)

// Util formatting functions for download time estimates
const getHours = time => Math.floor(time / 3600).toFixed(0)
const getMins = time =>
    Math.floor((time - getHours(time) * 3600) / 60).toFixed(0)
const getPaddedMins = time =>
    getMins(time) < 10 ? `0${getMins(time)}` : getMins(time)
const getTimeEstStr = time => `${getHours(time)}:${getPaddedMins(time)} h`

const getEstimate = (complete, remaining) => ({
    complete,
    remaining,
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
