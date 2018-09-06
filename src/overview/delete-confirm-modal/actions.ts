import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import analytics, { updateLastActive } from '../../analytics'
import { Thunk } from '../../options/types'
import * as selectors from './selectors'
import { acts as resultsActs } from '../results'
import { actions as searchFilterActs } from '../../search-filters'

export const show = createAction<{ url: string; index: number }>(
    'deleteConf/show',
    (url, index) => ({ url, index }),
)
export const hide = createAction('deleteConf/hide')
export const reset = createAction('deleteConf/reset')
export const resetDeleteIndex = createAction('deleteConf/resetDeleteIndex')

const processEventRPC = remoteFunction('processEvent')
const deletePagesRPC = remoteFunction('delPages')

export const deleteDocs: () => Thunk = () => async (dispatch, getState) => {
    const url = selectors.urlToDelete(getState())

    analytics.trackEvent({
        category: 'Overview',
        action: 'Delete result',
    })

    processEventRPC({
        type: 'deleteResult',
    })

    try {
        dispatch(hide())

        // Remove all assoc. docs from the database + index
        await deletePagesRPC([url])

        // Hide the result item + confirm modal directly (optimistically)
        dispatch(resultsActs.hideResultItem(url))
    } catch (error) {
        // Do nothing
    } finally {
        dispatch(searchFilterActs.removeTagFromFilter())
        dispatch(resetDeleteIndex())
        updateLastActive() // Consider user active (analytics)
    }
}
