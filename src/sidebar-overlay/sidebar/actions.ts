import { createAction } from 'redux-act'

import { Thunk } from '../types'
import { Page } from './types'
import * as selectors from './selectors'
import { remoteFunction } from 'src/util/webextensionRPC'
import { FLOWS, STAGES } from 'src/overview/onboarding/constants'
import {
    fetchOnboardingStage,
    setOnboardingStage,
} from 'src/overview/onboarding/utils'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications } from 'src/util/remote-functions-background'

export const setAnnotationsManager = createAction('setAnnotationsManager')

export const setSidebarOpen = createAction<boolean>('setSidebarOpen')

export const setIsLoading = createAction<boolean>('setIsLoading')

export const setPage = createAction<Page>('setPage')
export const nextResultsPage = createAction('sidebar/nextResultsPage')
export const resetResultsPage = createAction('sidebar/resetResultsPage')
export const setResultsExhausted = createAction<boolean>(
    'sidebar/setResultsExhausted',
)

export const setActiveAnnotationUrl = createAction<string>(
    'setActiveAnnotationUrl',
)

export const setHoverAnnotationUrl = createAction<string>(
    'setHoverAnnotationUrl',
)

export const setShowCongratsMessage = createAction<boolean>(
    'setShowCongratsMessage',
)

export const setMouseOverSidebar = createAction<boolean>('setMouseOverSidebar')

export const setPageType = createAction<'page' | 'all'>('setPageType')

export const setSearchType = createAction<'notes' | 'page' | 'social'>(
    'setSearchType',
)
export const setIsSocialPost = createAction<boolean>('sidebar/setIsSocialPost')

/**
 * Hydrates the initial state of the sidebar.
 */
export const initState: () => Thunk = () => (dispatch) => {
    dispatch(resetResultsPage())
}

export const closeSidebar: () => Thunk = () => async (dispatch) => {
    dispatch(setSidebarOpen(false))
}

export const checkAndSetCongratsMessage: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    const showCongratsMessage = selectors.showCongratsMessage(getState())
    const onboardingAnnotationStage = await fetchOnboardingStage(
        FLOWS.annotation,
    )

    if (
        !showCongratsMessage &&
        onboardingAnnotationStage === STAGES.annotation.annotationCreated
    ) {
        dispatch(setShowCongratsMessage(true))
        await setOnboardingStage(FLOWS.annotation, STAGES.done)
    } else if (showCongratsMessage) {
        // Since we need to display the congrats message only once,
        // it can be set to false after setting it true once.
        dispatch(setShowCongratsMessage(false))
    }
}

export const toggleBookmark: (url: string) => Thunk = (url) => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const annotations = selectors.annotations(state)
    const index = annotations.findIndex((annot) => annot.url === url)
    dispatch(toggleBookmarkState(index))
}

// Only toggles UI state; no DB side-effects
export const toggleBookmarkState: (i: number) => Thunk = (i) => (
    dispatch,
    getState,
) => {
    const state = getState()
    const annotations = selectors.annotations(state)
    const annotation = annotations[i]
}

export const togglePageType: () => Thunk = () => (dispatch, getState) => {
    const currPageType = selectors.pageType(getState())
    const newPageType = currPageType === 'page' ? 'all' : 'page'
    dispatch(setPageType(newPageType))
}
