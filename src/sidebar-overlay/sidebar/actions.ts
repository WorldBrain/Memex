import { createAction } from 'redux-act'

import { Thunk } from '../types'
import { RES_PAGE_SIZE } from './constants'
import { Annotation, Page } from './types'
import { Anchor } from 'src/direct-linking/content_script/interactions'
import * as selectors from './selectors'
import AnnotationsManager from '../annotations-manager'
import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import { FLOWS, STAGES } from 'src/overview/onboarding/constants'
import {
    fetchOnboardingStage,
    setOnboardingStage,
} from 'src/overview/onboarding/utils'
import { OpenSidebarArgs } from 'src/sidebar-overlay/types'
import { AnnotSearchParams } from 'src/search/background/types'
import normalizeUrl from 'src/util/encode-url-for-id'
import { handleDBQuotaErrors } from 'src/util/error-handler'

// Remote function declarations.
const processEventRPC = remoteFunction('processEvent')
const createNotifRPC = remoteFunction('createNotification')

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

export const setAnnotations = createAction<Annotation[]>('setAnnotations')
export const appendAnnotations = createAction<Annotation[]>(
    'sidebar/appendAnnotations',
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
        await dispatch(fetchAnnotations(isSocialPost))
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

export const fetchAnnotations: (
    isSocialPost?: boolean,
) => Thunk = isSocialPost => async (dispatch, getState) => {
    dispatch(setIsLoading(true))
    dispatch(resetResultsPage())

    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const { url } = selectors.page(state)

    if (annotationsManager) {
        const annotations = await annotationsManager.fetchAnnotationsWithTags(
            url,
            isSocialPost,
        )
        annotations.reverse()
        dispatch(setAnnotations(annotations))
        dispatch(nextResultsPage())
        dispatch(setResultsExhausted(annotations.length < RES_PAGE_SIZE))
    }

    dispatch(setIsLoading(false))
}

export const fetchMoreAnnotations: (
    isSocialPost?: boolean,
) => Thunk = isSocialPost => async (dispatch, getState) => {
    dispatch(setIsLoading(true))

    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const { url } = selectors.page(state)
    const currentPage = selectors.currentPage(state)

    if (annotationsManager) {
        const annotations = await annotationsManager.fetchAnnotationsWithTags(
            url,
            // RES_PAGE_SIZE,
            // currentPage * RES_PAGE_SIZE,
            isSocialPost,
        )
        annotations.reverse()
        dispatch(appendAnnotations(annotations))
        dispatch(nextResultsPage())
        dispatch(setResultsExhausted(annotations.length < RES_PAGE_SIZE))
    }

    dispatch(setIsLoading(false))
}

export const createAnnotation: (
    anchor: Anchor,
    body: string,
    comment: string,
    tags: string[],
    bookmarked?: boolean,
    isSocialPost?: boolean,
) => Thunk = (anchor, body, comment, tags, bookmarked, isSocialPost) => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const { url, title } = selectors.page(state)

    if (annotationsManager) {
        await annotationsManager.createAnnotation({
            url,
            title,
            body,
            comment,
            anchor,
            tags,
            bookmarked,
            isSocialPost,
        })

        // Re-fetch annotations.
        dispatch(fetchAnnotations())

        dispatch(checkAndSetCongratsMessage())
    }
}

export const editAnnotation: (
    url: string,
    comment: string,
    tags: string[],
) => Thunk = (url, comment, tags) => async (dispatch, getState) => {
    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const annotations = selectors.annotations(state)
    const index = annotations.findIndex(annot => annot.url === url)

    let annotation
    let body
    if (index !== -1) {
        annotation = annotations[index]
        body = annotation.body
    } else {
        /* In the case of user trying to edit the annotation from the results list.
        The sidebar isn't loaded, so the annotations aren't present in the sidebar's
        state. So the action just returns after saving the annotation. */
        if (annotationsManager) {
            await annotationsManager.editAnnotation({ url, comment, tags })
        }
        return
    }

    // Check that annotation isn't completely empty.
    if ((!body || !body.length) && !comment.length && !tags.length) {
        return
    }

    if (annotationsManager) {
        // Let annotationsManager handle editing the annotation in the storage.
        await annotationsManager.editAnnotation({ url, comment, tags })

        // Edit the annotation in Redux store.
        const newAnnotations = [
            ...annotations.slice(0, index),
            { ...annotation, comment, tags, lastEdited: Date.now() },
            ...annotations.slice(index + 1),
        ]
        dispatch(setAnnotations(newAnnotations))
    }
}

export const deleteAnnotation: (url: string) => Thunk = url => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const annotations = selectors.annotations(state)

    if (annotationsManager) {
        await annotationsManager.deleteAnnotation(url)
        const newAnnotations = annotations.filter(annot => annot.url !== url)
        dispatch(setAnnotations(newAnnotations))
    }
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
                createNotifRPC({
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

export const searchAnnotations: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    dispatch(setIsLoading(true))

    const state = getState()
    let { url } = selectors.page(state)

    url = url ? url : window.location.href

    if (selectors.pageType(state) !== 'page') {
        dispatch(setIsLoading(false))
        return
    }

    const searchParams: AnnotSearchParams = {
        query: state.searchBar.query,
        startDate: state.searchBar.startDate,
        endDate: state.searchBar.endDate,
        bookmarksOnly: state.searchFilters.onlyBookmarks,
        tagsInc: state.searchFilters.tags,
        tagsExc: state.searchFilters.tagsExc,
        domainsInc: state.searchFilters.domainsInc,
        domainsExc: state.searchFilters.domainsExc,
        limit: RES_PAGE_SIZE,
        collections: [state.searchFilters.lists],
        url,
    }

    const annotationsManager = selectors.annotationsManager(state)
    const annotations: Annotation[] = []

    if (annotationsManager) {
        const annotSearchResult = await annotationsManager.searchAnnotations(
            searchParams,
        )

        if (!searchParams.query) {
            const { annotsByDay } = annotSearchResult

            const sortedKeys = Object.keys(annotsByDay)
                .sort()
                .reverse()

            for (const day of sortedKeys) {
                const cluster = annotsByDay[day]
                for (const pageUrl of Object.keys(cluster)) {
                    if (pageUrl === normalizeUrl(searchParams.url)) {
                        annotations.push(...cluster[pageUrl])
                    }
                }
            }
        } else {
            const { docs } = annotSearchResult

            for (const doc of docs) {
                if (doc.url === normalizeUrl(searchParams.url)) {
                    annotations.push(...doc.annotations)
                }
            }
        }

        dispatch(setAnnotations(annotations))
        dispatch(setResultsExhausted(annotSearchResult.resultsExhausted))
    }

    dispatch(setIsLoading(false))
}
