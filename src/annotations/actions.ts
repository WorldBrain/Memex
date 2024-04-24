import { createAction } from 'redux-act'
import { Thunk } from 'src/sidebar-overlay/types'
import * as selectors from 'src/sidebar-overlay/sidebar/selectors'
import { RES_PAGE_SIZE } from 'src/sidebar-overlay/sidebar/constants'
import { AnnotSearchParams } from 'src/search/background/types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import {
    nextResultsPage,
    setIsLoading,
    setResultsExhausted,
} from 'src/sidebar-overlay/sidebar/actions'
import { Annotation } from 'src/annotations/types'

export const setAnnotations = createAction<Annotation[]>('setAnnotations')
export const appendAnnotations = createAction<Annotation[]>(
    'sidebar/appendAnnotations',
)

export const fetchMoreAnnotationsForPageUrl: (
    isSocialPost?: boolean,
) => Thunk = (isSocialPost) => async (dispatch, getState) => {
    dispatch(setIsLoading(true))

    const state = getState()
    const { url } = selectors.page(state)
    const currentPage = selectors.currentPage(state)
    dispatch(setIsLoading(false))
}

/* export const updateAnnotationState: (
    isSocialPost?: boolean,
) => Thunk = (annotationId, annotation) => async (dispatch, getState) => {
    const state = getState()
    const annotationsManager = selectors.annotationsManager(state)
    const { url } = selectors.page(state)
    dispatch(setAnnotations({ ...state., annotation }))
} */

export const editAnnotation: (
    url: string,
    comment: string,
    tags: string[],
) => Thunk = (url, comment, tags) => async (dispatch, getState) => {
    const state = getState()
}
export const deleteAnnotation: (url: string) => Thunk = (url) => async (
    dispatch,
    getState,
) => {
    const state = getState()
}
export const searchAnnotations: () => Thunk = () => async (
    dispatch,
    getState,
) => {
    dispatch(setIsLoading(true))

    const state = getState()
    let { url } = selectors.page(state)

    url = url ? url : globalThis.location.href

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

    dispatch(setIsLoading(false))
}
