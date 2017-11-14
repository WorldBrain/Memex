import { createSelector } from 'reselect'

export const entireState = state => state.blacklist
export const siteInputValue = createSelector(
    entireState,
    state => state.siteInputValue,
)

export const lastValue = createSelector(entireState, state => state.lastValue)
export const isRemoving = createSelector(entireState, state => state.isRemoving)
export const blacklist = createSelector(entireState, state => state.blacklist)

export const normalizedBlacklist = createSelector(blacklist, blacklist =>
    blacklist.map(entry => entry.expression.replace('\\.', '.')),
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
    (value, invalid) => !value.length || invalid,
)

export const isClearBtnDisabled = createSelector(
    siteInputValue,
    value => !value.length,
)
