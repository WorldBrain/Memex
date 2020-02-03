import { createAction } from 'redux-act'

import { Thunk } from '../types'
import { Page } from './types'
import * as selectors from './selectors'
import AnnotationsManager from '../../annotations/annotations-manager'
import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import { FLOWS, STAGES } from 'src/overview/onboarding/constants'
import {
    fetchOnboardingStage,
    setOnboardingStage,
} from 'src/overview/onboarding/utils'
import { OpenSidebarArgs } from 'src/sidebar-overlay/types'
import { handleDBQuotaErrors } from 'src/util/error-handler'
import { notifications } from 'src/util/remote-functions-background'
import {
    fetchAnnotationsForPageUrl,
    setAnnotations,
} from 'src/annotations/actions'

// Remote function declarations.
const processEventRPC = remoteFunction('processEvent')

export const setAnnotationsManager = createAction<AnnotationsManager>(
    'setAnnotationsManager',
)

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
export const initState: () => Thunk = () => dispatch => {
    dispatch(resetResultsPage())
}

export const openSidebar: (
    args: OpenSidebarArgs & {
        url?: string
        title?: string
        forceFetch?: boolean
        isSocialPost?: boolean
    },
) => Thunk = ({
    url,
    title,
    activeUrl,
    forceFetch,
    isSocialPost = false,
} = {}) => async (dispatch, getState) => {
    dispatch(setPage({ url, title }))
    dispatch(setSidebarOpen(true))
    dispatch(setIsSocialPost(isSocialPost))

    const annots = selectors.annotations(getState())
    if (forceFetch || !annots.length) {
        await dispatch(fetchAnnotationsForPageUrl(isSocialPost))
    }

    if (activeUrl) {
        dispatch(setActiveAnnotationUrl(activeUrl))
    }

    await processEventRPC({ type: EVENT_NAMES.OPEN_SIDEBAR_PAGE })
}

export const closeSidebar: () => Thunk = () => async dispatch => {
    dispatch(setSidebarOpen(false))
    await processEventRPC({ type: EVENT_NAMES.CLOSE_SIDEBAR_PAGE })
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
        await processEventRPC({
            type: EVENT_NAMES.FINISH_ANNOTATION_ONBOARDING,
        })
        await setOnboardingStage(FLOWS.annotation, STAGES.done)
    } else if (showCongratsMessage) {
        // Since we need to display the congrats message only once,
        // it can be set to false after setting it true once.
        dispatch(setShowCongratsMessage(false))
    }
}

export const toggleBookmark: (url: string) => Thunk = url => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const annotations = selectors.annotations(state)
    const index = annotations.findIndex(annot => annot.url === url)
    dispatch(toggleBookmarkState(index))

    try {
        await annotationsManager.toggleBookmark(url)
    } catch (err) {
        dispatch(toggleBookmarkState(index))
        handleDBQuotaErrors(
            error =>
                notifications.create({
                    requireInteraction: false,
                    title: 'Memex error: starring page',
                    message: error.message,
                }),
            () => remoteFunction('dispatchNotification')('db_error'),
        )(err)
    }
}

// Only toggles UI state; no DB side-effects
export const toggleBookmarkState: (i: number) => Thunk = i => (
    dispatch,
    getState,
) => {
    const state = getState()
    const annotations = selectors.annotations(state)
    const annotation = annotations[i]
    dispatch(
        setAnnotations([
            ...annotations.slice(0, i),
            { ...annotation, hasBookmark: !annotation.hasBookmark },
            ...annotations.slice(i + 1),
        ]),
    )
}

export const togglePageType: () => Thunk = () => (dispatch, getState) => {
    const currPageType = selectors.pageType(getState())
    const newPageType = currPageType === 'page' ? 'all' : 'page'
    dispatch(setPageType(newPageType))
}
