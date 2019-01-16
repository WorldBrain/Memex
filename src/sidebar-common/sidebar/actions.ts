import { createAction } from 'redux-act'

import { Thunk } from '../types'
import { Annotation, Page } from './types'
import { Anchor } from 'src/direct-linking/content_script/interactions'
import * as selectors from './selectors'
import AnnotationsManager from '../annotations-manager'
import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { STORAGE_KEYS } from 'src/overview/onboarding/constants'

// Remote function declarations.
const processEventRPC = remoteFunction('processEvent')

export const setAnnotationsManager = createAction<AnnotationsManager>(
    'setAnnotationsManager',
)

export const setSidebarOpen = createAction<boolean>('setSidebarOpen')

export const setIsLoading = createAction<boolean>('setIsLoading')

export const setPage = createAction<Page>('setPage')

export const setAnnotations = createAction<Annotation[]>('setAnnotations')

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
    dispatch(fetchAnnotations())
}

export const openSidebar: (url?: string, title?: string) => Thunk = (
    url = null,
    title = null,
) => async dispatch => {
    dispatch(setPage({ url, title }))
    dispatch(setSidebarOpen(true))
    dispatch(fetchAnnotations())
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

    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const { url } = selectors.page(state)

    if (annotationsManager) {
        const annotations = await annotationsManager.fetchAnnotationsWithTags(
            url,
        )
        dispatch(setAnnotations(annotations))
    }

    dispatch(setIsLoading(false))
}

export const createAnnotation: (
    anchor: Anchor,
    body: string,
    comment: string,
    tags: string[],
) => Thunk = (anchor, body, comment, tags) => async (dispatch, getState) => {
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
    const annotation = annotations[index]
    const { body } = annotation

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
            { ...annotation, comment, tags, lastEdited: new Date() },
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
    const onboardingAnnotationStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step1,
    )

    if (
        !showCongratsMessage &&
        onboardingAnnotationStage === 'annotation_created'
    ) {
        dispatch(setShowCongratsMessage(true))
        await processEventRPC({
            type: EVENT_NAMES.FINISH_ANNOTATION_ONBOARDING,
        })
        await setLocalStorage(STORAGE_KEYS.onboardingDemo.step1, 'DONE')
    } else if (showCongratsMessage) {
        // Since we need to display the congrats message only once,
        // it can be set to false after setting it true once.
        dispatch(setShowCongratsMessage(false))
    }
}
