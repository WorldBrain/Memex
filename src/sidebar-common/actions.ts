import { createAction } from 'redux-act'

import { Annotation, Page, Thunk } from './types'
import { Anchor } from '../direct-linking/content_script/interactions'
import * as selectors from './selectors'
import AnnotationsManager from './annotations-manager'

export const setAnnotationsManager = createAction<AnnotationsManager>(
    'setAnnotationsManager',
)

export const setSidebarOpen = createAction<boolean>('setSidebarOpen')

export const setIsLoading = createAction<boolean>('setIsLoading')

export const setPage = createAction<Page>('setPage')

export const setPageUrl = createAction<string>('setPageUrl')

export const setPageTitle = createAction<string>('setPageTitle')

export const setAnnotations = createAction<Annotation[]>('setAnnotations')

export const openSidebar: (url: string, title: string) => Thunk = (
    url,
    title,
) => dispatch => {
    dispatch(setPage({ url, title }))
    dispatch(setSidebarOpen(true))
    dispatch(fetchAnnotations())
}

/**
 * Hydrates the initial state of the sidebar.
 */
export const initState: () => Thunk = () => dispatch => {
    dispatch(fetchAnnotations())
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
    }
}

// TODO: Perform a check for empty comment and no anchor.
export const editAnnotation: (
    url: string,
    comment: string,
    tags: string[],
) => Thunk = (url, comment, tags) => async (dispatch, getState) => {
    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)

    if (annotationsManager) {
        await annotationsManager.editAnnotation({ url, comment, tags })
        dispatch(fetchAnnotations())
    }
}

export const deleteAnnotation: (url: string) => Thunk = url => async (
    dispatch,
    getState,
) => {
    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)

    if (annotationsManager) {
        await annotationsManager.deleteAnnotation(url)
        dispatch(fetchAnnotations())
    }
}
