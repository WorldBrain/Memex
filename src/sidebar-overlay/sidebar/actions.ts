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
const getAllAnnotationsRPC = remoteFunction('getAllAnnotations')
// const getTagsByAnnotationUrlRPC = remoteFunction('getTagsByAnnotationUrl')

export const setSidebarOpen = createAction<boolean>('setSidebarOpen')

export const setPage = createAction<Page>('setPage')

export const setPageUrl = createAction<string>('setPageUrl')

export const setPageTitle = createAction<string>('setPageTitle')

export const setAnnotations = createAction<Annotation[]>('setAnnotations')

export const fetchAnnotations: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    // dispatch(setIsLoading(true))
    const state = getState()
    const { url } = selectors.page(state)
    const annotations = await getAllAnnotationsRPC(url)
    // const tags = await fetchAllTags(annotations)

    // dispatch(setTags(tags))
    dispatch(setAnnotations(annotations))
    // dispatch(setIsLoading(false))
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
