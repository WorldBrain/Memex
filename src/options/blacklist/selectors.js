import { createSelector } from 'reselect'

export const entireState = state => state.blacklist
export const siteInputValue = createSelector(
    entireState,
    state => state.siteInputValue,
)

export const blacklist = createSelector(entireState, state => state.blacklist)

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
