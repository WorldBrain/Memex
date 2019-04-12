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

/**
 * Hydrates the initial state of the sidebar.
 */
export const initState: () => Thunk = () => dispatch => {
    dispatch(resetResultsPage())
}

export const openSidebar: (
    args: {
        url?: string
        title?: string
        forceFetch?: boolean
    } & OpenSidebarArgs,
) => Thunk = ({
    url,
    title,
    activeUrl,
    forceFetch,
    openToCollections,
    openToComment,
    openToTags,
}: OpenSidebarArgs & {
    url?: string
    title?: string
    forceFetch?: boolean
} = {}) => async (dispatch, getState) => {
    dispatch(setPage({ url, title }))
    dispatch(setSidebarOpen(true))

    if (openToCollections) {
        console.log('triggered "open to collections"')
    }
    if (openToComment) {
        console.log('triggered "open to comment"')
    }
    if (openToTags) {
        console.log('triggered "open to tags"')
    }

    const annots = selectors.annotations(getState())
    if (forceFetch || !annots.length) {
        await dispatch(fetchAnnotations())
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

export const fetchAnnotations: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    dispatch(setIsLoading(true))
    dispatch(resetResultsPage())

    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const { url } = selectors.page(state)

    if (annotationsManager) {
        const annotations = await annotationsManager.fetchAnnotationsWithTags(
            url,
        )
        annotations.reverse()
        dispatch(setAnnotations(annotations))
        dispatch(nextResultsPage())
        dispatch(setResultsExhausted(annotations.length < RES_PAGE_SIZE))
    }

    dispatch(setIsLoading(false))
}

export const fetchMoreAnnotations: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    dispatch(setIsLoading(true))

    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const { url } = selectors.page(state)
    const currentPage = selectors.currentPage(state)

    if (annotationsManager) {
        const annotations = await annotationsManager.fetchAnnotationsWithTags(
            url,
            RES_PAGE_SIZE,
            currentPage * RES_PAGE_SIZE,
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
) => Thunk = (anchor, body, comment, tags, bookmarked) => async (
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

    await annotationsManager.toggleBookmark(url)

    const index = annotations.findIndex(annot => annot.url === url)
    const annotation: Annotation = annotations[index]
    const newAnnotations: Annotation[] = [
        ...annotations.slice(0, index),
        { ...annotation, hasBookmark: !annotation.hasBookmark },
        ...annotations.slice(index + 1),
    ]
    dispatch(setAnnotations(newAnnotations))
}
