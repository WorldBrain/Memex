import moment from 'moment'

import {
    StandardSearchResponse,
    AnnotationsSearchResponse,
    AnnotsByPageUrl,
    AnnotPage,
} from 'src/search/background/types'
import {
    PageData,
    NormalizedState,
    PageResult,
    PageResultsByDay,
    NoteData,
    SearchResultToState,
    NoteResult,
    NoteFormState,
    RootState,
} from './types'
import { Annotation } from 'src/annotations/types'

export const formatDayGroupTime = (day: number) =>
    moment(day).calendar(null, {
        sameDay: '[Today]',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'dddd, DD MMMM, YYYY',
    })

export const initNormalizedState = <T>(): NormalizedState<T> => ({
    allIds: [],
    byId: {},
})

export const getInitialFormState = (): NoteFormState => ({
    tags: [],
    inputValue: '',
    isTagPickerShown: false,
})

export const areAllNotesShown = ({ results }: RootState): boolean => {
    for (const { pages } of Object.values(results)) {
        for (const { areNotesShown } of Object.values(pages.byId)) {
            if (!areNotesShown) {
                return false
            }
        }
    }
    return true
}

export const bindFunctionalProps = <
    Props = { [key: string]: (...args: any) => any },
    BoundProps = { [key: string]: (...args: any) => any }
>(
    props: Props,
    ...args
): BoundProps => {
    const boundProps = {} as BoundProps

    for (const [key, fn] of Object.entries(props)) {
        boundProps[key] = fn(...args)
    }

    return boundProps
}

export const getInitialPageResultState = (
    id: string,
    noteIds: string[] = [],
): PageResult => ({
    id,
    notesType: 'user',
    areNotesShown: false,
    isTagPickerShown: false,
    isCopyPasterShown: false,
    isListPickerShown: false,
    sortingFn: (a, b) => 1,
    loadNotesState: 'pristine',
    newNoteForm: getInitialFormState(),
    noteIds: { user: noteIds, followed: [], search: [] },
})

export const getInitialNoteResultState = (): NoteResult => ({
    isEditing: false,
    isBookmarked: false,
    areRepliesShown: false,
    isTagPickerShown: false,
    isCopyPasterShown: false,
    isDeleteModalShown: false,
    editNoteForm: getInitialFormState(),
})

const pageResultToPageData = (pageResult: AnnotPage): PageData => ({
    tags: pageResult.tags,
    lists: pageResult.lists,
    fullUrl: pageResult.url,
    isDeleteModalShown: false,
    fullTitle: pageResult.title,
    normalizedUrl: pageResult.url,
    displayTime: pageResult.displayTime,
    isBookmarked: pageResult.hasBookmark,
})

const annotationToNoteData = (
    annotation: Annotation,
): NoteData & NoteResult => ({
    url: annotation.url,
    pageUrl: annotation.pageUrl,
    highlight: annotation.body,
    comment: annotation.comment,
    tags: annotation.tags ?? [],
    isBookmarked: annotation.isBookmarked ?? false,
    areRepliesShown: false,
    isTagPickerShown: false,
    isCopyPasterShown: false,
    isDeleteModalShown: false,
    displayTime:
        annotation.lastEdited?.getTime() ?? annotation.createdWhen.getTime(),
    isEditing: false,
    isEdited: annotation.lastEdited != null,
    editNoteForm: {
        inputValue: annotation.comment ?? '',
        tags: annotation.tags ?? [],
        isTagPickerShown: false,
    },
})

export const annotationSearchResultToState: SearchResultToState = (
    result: AnnotationsSearchResponse,
) => {
    if (!result.isAnnotsSearch) {
        return pageSearchResultToState(result)
    }

    const pageData = initNormalizedState<PageData>()
    const noteData = initNormalizedState<NoteData & NoteResult>()

    const resultState: { [day: number]: PageResultsByDay } = {}
    const dayEntries: [number, AnnotsByPageUrl][] = Object.entries(
        result.annotsByDay,
    ) as any

    for (const [day, annotsByPageUrl] of dayEntries) {
        const dayNumber = +day // Make sure to cast to `number`, as Object.entries will auto-cast it to a `string`
        const pageResults = initNormalizedState<PageResult>()

        for (const [pageUrl, annotations] of Object.entries(annotsByPageUrl)) {
            const noteIds = annotations.map((a) => a.url)

            pageResults.allIds.push(pageUrl)
            pageResults.byId[pageUrl] = getInitialPageResultState(
                pageUrl,
                noteIds,
            )

            for (const annotation of annotations) {
                pageResults.byId[pageUrl].noteIds.search.push(annotation.url)

                noteData.allIds.push(annotation.url)
                noteData.byId[annotation.url] = annotationToNoteData(annotation)
            }
        }

        resultState[dayNumber] = {
            day: dayNumber,
            pages: pageResults,
        }
    }

    for (const pageResult of result.docs) {
        const id = pageResult.url

        pageData.allIds.push(id)
        pageData.byId[id] = pageResultToPageData(pageResult)
    }

    return { noteData, pageData, results: resultState }
}

export const pageSearchResultToState: SearchResultToState = (
    result: StandardSearchResponse,
) => {
    const pageData = initNormalizedState<PageData>()
    const noteData = initNormalizedState<NoteData & NoteResult>()
    const pageResults = initNormalizedState<PageResult>()

    for (const pageResult of result.docs) {
        const id = pageResult.url
        const noteIds = pageResult.annotations.map((a) => a.url)

        pageData.byId[id] = pageResultToPageData(pageResult)
        pageResults.byId[id] = getInitialPageResultState(
            pageResult.url,
            noteIds,
        )

        pageData.allIds.push(id)
        pageResults.allIds.push(id)

        for (const annotation of pageResult.annotations) {
            pageResults.byId[id].noteIds.search.push(annotation.url)

            noteData.allIds.push(annotation.url)
            noteData.byId[annotation.url] = annotationToNoteData(annotation)
        }
    }

    return {
        noteData,
        pageData,
        results: { [-1]: { day: -1, pages: pageResults } },
    }
}
