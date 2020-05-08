import { createAction } from 'redux-act'

import { remoteFunction } from '../../util/webextensionRPC'
import analytics from '../../analytics'
import { Thunk } from '../../options/types'
import * as selectors from './selectors'
import { acts as resultsActs, selectors as results } from '../results'
import { actions as searchFilterActs } from '../../search-filters'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications } from 'src/util/remote-functions-background'

export const show = createAction<{ url: string; index: number }>(
    'deleteConf/show',
    (url, index) => ({ url, index }),
)
export const hide = createAction('deleteConf/hide')
export const reset = createAction('deleteConf/reset')
export const resetDeleteIndex = createAction('deleteConf/resetDeleteIndex')

const processEventRPC = remoteFunction('processEvent')
const deletePagesRPC = remoteFunction('delPages')
const deleteSocialPagesRPC = remoteFunction('delSocialPages')

export const deleteDocs: () => Thunk = () => async (dispatch, getState) => {
    const url = selectors.urlToDelete(getState())
    const isForSocial = results.isSocialPost(getState())

    analytics.trackEvent({
        category: 'Pages',
        action: 'deleteViaOverview',
    })

    processEventRPC({
        type: EVENT_NAMES.DELETE_RESULT,
    })

    try {
        dispatch(hide())

        const deleteRPC = isForSocial ? deleteSocialPagesRPC : deletePagesRPC

        // Remove all assoc. docs from the database + index
        await deleteRPC([url])

        dispatch(resultsActs.hideResultItem(url))
    } catch (err) {
        handleDBQuotaErrors(
            error =>
                notifications.create({
                    requireInteraction: false,
                    title: 'Memex error: deleting page',
                    message: error.message,
                }),
            () => remoteFunction('dispatchNotification')('db_error'),
        )(err)
    }
    dispatch(searchFilterActs.removeTagFromFilter())
    dispatch(resetDeleteIndex())
}
