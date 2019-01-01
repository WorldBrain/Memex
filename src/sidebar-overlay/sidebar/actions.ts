import { createAction } from 'redux-act'

import { Annotation, Page } from './types'
import { Thunk } from '../types'
import { remoteFunction } from '../../util/webextensionRPC'
import { Anchor } from 'src/direct-linking/content_script/interactions'
import * as selectors from './selectors'

// Remote function declarations.
const processEventRPC = remoteFunction('processEvent')
const createAnnotationRPC = remoteFunction('createAnnotation')
const addAnnotationTagRPC = remoteFunction('addAnnotationTag')
const getAllAnnotationsByUrlRPC = remoteFunction('getAllAnnotationsByUrl')
const getTagsByAnnotationUrlRPC = remoteFunction('getTagsByAnnotationUrl')

export const setSidebarOpen = createAction<boolean>('setSidebarOpen')

export const setIsLoading = createAction<boolean>('setIsLoading')

export const setPage = createAction<Page>('setPage')

export const setPageUrl = createAction<string>('setPageUrl')

export const setPageTitle = createAction<string>('setPageTitle')

export const setAnnotations = createAction<Annotation[]>('setAnnotations')

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
    const state = getState()

    // Set `isLoading` to true, if currently the sidebar has no annotations.
    const annotations = selectors.annotations(state)
    if (annotations.length === 0) {
        dispatch(setIsLoading(true))
    }

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
