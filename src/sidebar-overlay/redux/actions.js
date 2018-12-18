import { createAction } from 'redux-act'
import { remoteFunction } from 'src/util/webextensionRPC'
import { remove } from 'lodash/array'

import {
    selectors as commentSelectors,
    actions as commentActions,
} from '../comment-box'
import * as selectors from './selectors'
import { EVENT_NAMES } from '../../analytics/internal/constants'
import { getLocalStorage } from 'src/search-injection/utils'
import { STORAGE_KEYS } from 'src/overview/onboarding/constants'
import { setLocalStorage } from 'src/util/storage'

const getAllAnnotationsRPC = remoteFunction('getAllAnnotations')
const getAnnotationTagsRPC = remoteFunction('getAnnotationTags')
const addAnnotationTagRPC = remoteFunction('addAnnotationTag')
const createAnnotationRPC = remoteFunction('createAnnotation')
const editAnnotationRPC = remoteFunction('editAnnotation')
const deleteAnnotationRPC = remoteFunction('deleteAnnotation')
const processEventRPC = remoteFunction('processEvent')

export const setAnnotations = createAction('setAnnotations')

export const setTags = createAction('setTags')

export const setActiveAnnotation = createAction('setActiveAnnotation')

export const setHoveredAnnotation = createAction('setHoveredAnnotation')

export const setAnnotationCount = createAction('setAnnotationCount')

export const setIsLoading = createAction('setIsLoading')

export const setCongratsMessage = createAction('setCongratsMessage')

export const setPageInfo = createAction('setPageInfo')

const fetchAllTags = async annotations => {
    const tags = {}
    await Promise.all(
        annotations.map(async ({ url }) => {
            const annotationTags = await getAnnotationTagsRPC(url)
            tags[url] = annotationTags
        }),
    )
    return tags
}

export const fetchAnnotationAct = () => async (dispatch, getState) => {
    dispatch(setAnnotations([]))
    dispatch(setIsLoading(true))
    const state = getState()
    const { url } = selectors.page(state)
    const annotations = await getAllAnnotationsRPC(url)
    const tags = await fetchAllTags(annotations)

    dispatch(setTags(tags))
    dispatch(setAnnotations(annotations))
    dispatch(setIsLoading(false))
}

export const setAnnotationAndTags = annotations => async dispatch => {
    const tags = await fetchAllTags(annotations)
    dispatch(setTags(tags))
    dispatch(setAnnotations(annotations))
    dispatch(setIsLoading(false))
}

export const findAnnotationCount = () => async (dispatch, getState) => {
    const state = getState()
    const { url } = selectors.page(state)
    const annotations = await getAllAnnotationsRPC(url)
    dispatch(setAnnotationCount(annotations.length))
}

export const createAnnotation = (comment, body, tags, env) => async (
    dispatch,
    getState,
) => {
    processEventRPC({
        type: EVENT_NAMES.CREATE_ANNOTATION,
    })

    const state = getState()
    const { url, title } = selectors.page(state)
    const anchor = commentSelectors.anchor(state)
    // Write annotation to database
    const uniqueUrl = await createAnnotationRPC({
        url,
        title,
        body,
        comment,
        selector: anchor,
    })

    // Write tags to database
    tags.forEach(async tag => {
        await addAnnotationTagRPC({
            tag,
            url: uniqueUrl,
        })
    })

    dispatch(commentActions.setAnchor(null))
    dispatch(setActiveAnnotation(uniqueUrl))
    if (env === 'overview') {
        dispatch(fetchAnnotationAct())
    }

    const congratsMessage = selectors.congratsMessage(state)
    const onboardingAnnotationStage = await getLocalStorage(
        STORAGE_KEYS.onboardingDemo.step1,
    )
    if (
        !congratsMessage &&
        onboardingAnnotationStage === 'annotation_created'
    ) {
        dispatch(setCongratsMessage(true))
        processEventRPC({
            type: EVENT_NAMES.FINISH_ANNOTATION_ONBOARDING,
        })
        await setLocalStorage(STORAGE_KEYS.onboardingDemo.step1, 'DONE')
    } else if (congratsMessage) {
        // Since we need to display the congrats message only once,
        // it can be set to false after setting it true once.
        dispatch(setCongratsMessage(false))
    }
}

export const editAnnotation = (url, comment) => async (dispatch, getState) => {
    await editAnnotationRPC(url, comment)
    const state = getState()
    const annotations = [...selectors.annotations(state)]
    annotations.forEach(annotation => {
        if (annotation.url === url) {
            annotation.comment = comment
            annotation.lastEdited = new Date().getTime()
        }
    })
    dispatch(setAnnotations(annotations))
}

export const deleteAnnotation = url => async (dispatch, getState) => {
    processEventRPC({
        type: EVENT_NAMES.DELETE_ANNOTATION,
    })

    await deleteAnnotationRPC(url)
    const state = getState()
    const annotations = [...selectors.annotations(state)]
    const predicate = annotation => annotation.url === url
    remove(annotations, predicate)
    dispatch(setAnnotations(annotations))
}
