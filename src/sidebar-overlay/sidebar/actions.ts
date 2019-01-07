import { createAction } from 'redux-act'

import { Annotation, Page } from './types'
import { Thunk } from '../types'
import { remoteFunction } from '../../util/webextensionRPC'
import { Anchor } from '../../direct-linking/content_script/interactions'
import * as selectors from './selectors'
import { getTagArrays } from '../utils'

// Remote function declarations.
const processEventRPC = remoteFunction('processEvent')
const createAnnotationRPC = remoteFunction('createAnnotation')
const addAnnotationTagRPC = remoteFunction('addAnnotationTag')
const getAllAnnotationsByUrlRPC = remoteFunction('getAllAnnotationsByUrl')
const getTagsByAnnotationUrlRPC = remoteFunction('getTagsByAnnotationUrl')
const editAnnotationRPC = remoteFunction('editAnnotation')
const deleteAnnotationRPC = remoteFunction('deleteAnnotation')
const editAnnotationTagsRPC = remoteFunction('editAnnotationTags')

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
    const { url } = selectors.page(state)
    // TODO: Following type conversion is incorrect. Correct it once the backend
    // for annotations search is in place.
    const annotationsWithoutTags: Annotation[] = await getAllAnnotationsByUrlRPC(
        url,
    )
    const fetchedAnnotations = await Promise.all(
        annotationsWithoutTags.map(async (annotation: Annotation) => {
            const annotationTags: {
                name: string
                url: string
            }[] = await getTagsByAnnotationUrlRPC(annotation.url)
            const tags = annotationTags.map(tag => tag.name)
            return {
                ...annotation,
                tags,
            }
        }),
    )

    dispatch(setAnnotations(fetchedAnnotations))
    dispatch(setIsLoading(false))
}

export const createAnnotation: (
    anchor: Anchor,
    body: string,
    comment: string,
    tags: string[],
) => Thunk = (anchor, body, comment, tags) => async (dispatch, getState) => {
    processEventRPC({ type: 'createAnnotation' })

    const state = getState()
    const { url, title } = selectors.page(state)

    // Write annotation to database.
    const uniqueUrl = await createAnnotationRPC({
        url,
        title,
        body,
        comment,
        selector: anchor,
    })

    // Write tags to database.
    tags.forEach(async tag => {
        await addAnnotationTagRPC({ tag, url: uniqueUrl })
    })

    // Re-fetch annotations.
    dispatch(fetchAnnotations())
}

// TODO: Perform a check for empty comment and no anchor.
export const editAnnotation: (
    url: string,
    comment: string,
    tags: string[],
) => Thunk = (url, comment, tags) => async (dispatch, getState) => {
    // Save the new annotation to the storage.
    await editAnnotationRPC(url, comment)

    // Get the previous annotation from the state.
    const state = getState()
    const annotations = selectors.annotations(state)
    const index = annotations.findIndex(annotation => annotation.url === url)
    const prevAnnotation = annotations[index]

    // Evaluate which tags need to be added and which need to be deleted.
    const { tagsToBeAdded, tagsToBeDeleted } = getTagArrays(
        prevAnnotation.tags,
        tags,
    )
    await editAnnotationTagsRPC({ tagsToBeAdded, tagsToBeDeleted, url })

    // Update state to reflect the edit.
    const updatedAnnotations = [
        ...annotations.slice(0, index),
        { ...prevAnnotation, tags },
        ...annotations.slice(index + 1),
    ]
    dispatch(setAnnotations(updatedAnnotations))
}

export const deleteAnnotation: (url: string) => Thunk = url => async (
    dispatch,
    getState,
) => {
    // TODO: Process event.

    await deleteAnnotationRPC(url)

    const state = getState()
    const annotations = selectors.annotations(state)
    const newAnnotations = annotations.filter(
        annotation => annotation.url !== url,
    )
    dispatch(setAnnotations(newAnnotations))
}
