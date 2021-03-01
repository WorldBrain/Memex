import { createAction } from 'redux-act'
import { SHOULD_OPEN_STORAGE_KEY } from 'src/options/PDF/constants'

export const setOpeningFlag = createAction('pdfs/setOpeningFlag', (value) => {
    // Value will be string from UI events, else bool from storage syncing
    if (typeof value === 'string') {
        return value === 'y'
    }

    return value
})

export const toggleOpeningOptOut = (isOptIn, skipEventOpen = false) => async (
    dispatch,
) => {
    dispatch(setOpeningFlag(isOptIn))

    browser.storage.local.set({
        [SHOULD_OPEN_STORAGE_KEY]: isOptIn,
    })
}
