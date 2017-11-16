import { createSelector } from 'reselect'

export const entireState = state => state.blacklist
export const siteInputValue = createSelector(
    entireState,
    state => state.siteInputValue,
)

export const lastValue = createSelector(entireState, state => state.lastValue)
export const isLoading = createSelector(entireState, state => state.isLoading)
export const matchedDocCount = createSelector(
    entireState,
    state => state.matchedDocCount,
)
export const blacklist = createSelector(entireState, state => state.blacklist)

const blacklistEntries = createSelector(
    blacklist,
    blacklist => new Set(blacklist.map(entry => entry.expression)),
)

export const normalizedBlacklist = createSelector(blacklistEntries, blacklist =>
    [...blacklist].map(exp => exp.replace('\\.', '.')),
)

export const isInputAlreadyStored = createSelector(
    blacklistEntries,
    siteInputValue,
    (blacklist, input) => blacklist.has(input.replace('.', '\\.')),
)

export const showRemoveModal = createSelector(
    entireState,
    state => state.showRemoveModal,
)

export const isInputRegexInvalid = createSelector(siteInputValue, value => {
    try {
        RegExp(value)
        return false
    } catch (e) {
        return true
    }
})

export const isSaveBtnDisabled = createSelector(
    siteInputValue,
    isInputRegexInvalid,
    isInputAlreadyStored,
    (value, invalid, duped) => !value.length || invalid || duped,
)

export const isClearBtnDisabled = createSelector(
    siteInputValue,
    value => !value.length,
)
