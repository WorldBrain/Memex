import moment from 'moment'

import type {
    StandardSearchResponse,
    AnnotationsSearchResponse,
    AnnotsByPageUrl,
    AnnotPage,
} from 'src/search/background/types'
import type {
    PageData,
    PageResult,
    PageResultsByDay,
    NoteData,
    SearchResultToState,
    NoteResult,
    NoteFormState,
    RootState,
    NestedResults,
    NotesType,
} from './types'
import type { Annotation } from 'src/annotations/types'
import { PAGE_SEARCH_DUMMY_DAY } from '../constants'
import { sortByPagePosition } from 'src/sidebar/annotations-sidebar/sorting'
import {
    initNormalizedState,
    mergeNormalizedStates,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { isPagePdf } from '@worldbrain/memex-common/lib/page-indexing/utils'

export const notesTypeToString = (type: NotesType): string => {
    if (type === 'user') {
        return 'Your notes'
    }
    if (type === 'followed') {
        return 'Shared with me'
    }
    return 'Results'
}

export const stringToNotesType = (str: string): NotesType => {
    if (str === 'Your notes') {
        return 'user'
    }
    if (str === 'Shared with me') {
        return 'followed'
    }
    return 'search'
}

export const formatDayGroupTime = (day: number) =>
    moment(day).calendar(null, {
        sameDay: '[Today]',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'dddd, DD MMMM, YYYY',
    })

export const getInitialFormState = (inputValue = ''): NoteFormState => ({
    tags: [],
    lists: [],
    inputValue,
    isTagPickerShown: false,
    isListPickerShown: false,
})

export const areAllNotesShown = ({ results }: RootState): boolean => {
    for (const { pages, day } of Object.values(results)) {
        const pageIdsWithNotes = pages.allIds.filter((pageId) => {
            const page = results[day].pages.byId[pageId]
            return page.noteIds[page.notesType].length > 0
        })

        for (const pageId of pageIdsWithNotes) {
            if (!results[day].pages.byId[pageId].areNotesShown) {
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
    extra: Partial<PageResult> = {},
): PageResult => ({
    id,
    notesType: 'user',
    areNotesShown: false,
    isTagPickerShown: false,
    isShareMenuShown: false,
    isCopyPasterShown: false,
    isListPickerShown: false,
    loadNotesState: 'pristine',
    newNoteForm: getInitialFormState(),
    noteIds: { user: noteIds, followed: [], search: [] },
    hoverState: null,
    ...extra,
})

export const getInitialNoteResultState = (inputValue = ''): NoteResult => ({
    isEditing: false,
    areRepliesShown: false,
    isTagPickerShown: false,
    isListPickerShown: false,
    shareMenuShowStatus: 'hide',
    isCopyPasterShown: false,
    editNoteForm: getInitialFormState(inputValue),
})

const pageResultToPageData = (pageResult: AnnotPage): PageData => {
    const isPdf = isPagePdf(pageResult)
    return {
        tags: pageResult.tags,
        lists: pageResult.lists,
        fullUrl: pageResult.fullUrl,
        fullTitle: pageResult.title,
        normalizedUrl: pageResult.url,
        favIconURI: pageResult.favIcon,
        displayTime: pageResult.displayTime,
        hasNotes: pageResult.annotsCount > 0,
        type: isPdf ? 'pdf' : 'page',
        fullPdfUrl: isPdf ? pageResult.fullPdfUrl! : undefined,
        pdfUrl: isPdf ? pageResult.pdfUrl! : undefined,
    }
}

const annotationToNoteData = (
    annotation: Annotation,
): NoteData & NoteResult => ({
    url: annotation.url,
    pageUrl: annotation.pageUrl,
    highlight: annotation.body,
    comment: annotation.comment,
    tags: annotation.tags ?? [],
    lists: annotation.lists ?? [],
    selector: annotation.selector,
    createdWhen: annotation.createdWhen,
    displayTime: new Date(
        annotation.lastEdited ?? annotation.createdWhen,
    ).getTime(),
    isEdited: annotation.lastEdited != null,
    isShared: annotation.isShared,
    isBulkShareProtected: !!annotation.isBulkShareProtected,
    ...getInitialNoteResultState(),
    editNoteForm: {
        inputValue: annotation.comment ?? '',
        tags: annotation.tags ?? [],
        // TODO: make into lists
        lists: annotation.lists ?? [],
        isTagPickerShown: false,
        isListPickerShown: false,
    },
})

export const annotationSearchResultToState: SearchResultToState = (
    result: AnnotationsSearchResponse,
) => {
    // This case is for annots search with terms set
    if (!result.isAnnotsSearch) {
        return pageSearchResultToState(result, { areNotesShown: true })
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
            const sortedAnnots = annotations.sort(sortByPagePosition)
            const noteIds = sortedAnnots.map((a) => a.url)

            pageResults.allIds.push(pageUrl)
            pageResults.byId[pageUrl] = getInitialPageResultState(
                pageUrl,
                noteIds,
                { areNotesShown: true },
            )

            for (const annotation of sortedAnnots) {
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
    extraPageResultState,
) => {
    const pageData = initNormalizedState<PageData>()
    const noteData = initNormalizedState<NoteData & NoteResult>()
    const pageResults = initNormalizedState<PageResult>()

    for (const pageResult of result.docs) {
        const id = pageResult.url
        const sortedAnnots = pageResult.annotations.sort(sortByPagePosition)
        const noteIds = sortedAnnots.map((a) => a.url)

        pageData.byId[id] = pageResultToPageData(pageResult)
        pageResults.byId[id] = getInitialPageResultState(
            pageResult.url,
            noteIds,
            extraPageResultState,
        )

        pageData.allIds.push(id)
        pageResults.allIds.push(id)

        for (const annotation of sortedAnnots) {
            noteData.allIds.push(annotation.url)
            noteData.byId[annotation.url] = annotationToNoteData(annotation)
        }
    }

    return {
        noteData,
        pageData,
        results: {
            [PAGE_SEARCH_DUMMY_DAY]: {
                day: PAGE_SEARCH_DUMMY_DAY,
                pages: pageResults,
            },
        },
    }
}

export const mergeSearchResults = (
    ...toMerge: NestedResults[]
): NestedResults => {
    const merged: NestedResults = {}

    for (const results of toMerge) {
        for (const { day, pages } of Object.values(results)) {
            if (!merged[day]) {
                merged[day] = {
                    day,
                    pages: initNormalizedState(),
                }
            }

            merged[day].pages = mergeNormalizedStates(merged[day].pages, pages)
        }
    }

    return merged
}
