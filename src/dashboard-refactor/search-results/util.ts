import type {
    StandardSearchResponse,
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
import { isMemexPageAPdf } from '@worldbrain/memex-common/lib/page-indexing/utils'
import { formateCalendarTime } from '@worldbrain/memex-common/lib/utils/date-time'
import type {
    PageAnnotationsCacheInterface,
    RGBAColor,
} from 'src/annotations/cache/types'

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
    formateCalendarTime(day, {
        sameDay: '[Today]',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'dddd, DD MMMM, YYYY',
    })

export const getInitialFormState = (
    inputValue = '',
    bodyInputValue?: string,
): NoteFormState => ({
    tags: [],
    lists: [],
    inputValue,
    isTagPickerShown: false,
    isListPickerShown: false,
    bodyInputValue: bodyInputValue,
    isShown: false,
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
    activePage: undefined,
    areNotesShown: false,
    isTagPickerShown: false,
    isShareMenuShown: false,
    isCopyPasterShown: false,
    listPickerShowStatus: 'hide',
    loadNotesState: 'pristine',
    newNoteForm: getInitialFormState(),
    noteIds: { user: noteIds, followed: [], search: [] },
    hoverState: null,
    copyLoadingState: 'pristine',
    editTitleState: null,
    ...extra,
})

export const getInitialNoteResultState = (
    inputValue?: string,
    bodyInputValue?: string,
): NoteResult => ({
    isEditing: false,
    isBodyEditing: false,
    areRepliesShown: false,
    isTagPickerShown: false,
    listPickerShowStatus: 'hide',
    shareMenuShowStatus: 'hide',
    isCopyPasterShown: false,
    editNoteForm: getInitialFormState(inputValue, bodyInputValue),
    copyLoadingState: 'pristine',
})

const pageResultToPageData = (
    pageResult: AnnotPage,
    cache: PageAnnotationsCacheInterface,
): PageData => {
    const isPdf = isMemexPageAPdf(pageResult)
    const lists = pageResult.lists
        .map((localListId) => cache.getListByLocalId(localListId)?.unifiedId)
        .filter((id) => id != null)
    return {
        lists,
        fullUrl: pageResult.fullUrl,
        fullTitle: pageResult.fullTitle,
        text: pageResult.text,
        normalizedUrl: pageResult.url,
        favIconURI: pageResult.favIcon,
        displayTime: pageResult.displayTime,
        hasNotes: pageResult.annotations.length > 0,
        type: isPdf ? 'pdf' : 'page',
        fullPdfUrl: isPdf ? pageResult.fullPdfUrl! : undefined,
        totalAnnotationCount: pageResult.totalAnnotationsCount,
        isInFocus: false,
    }
}

const annotationToNoteData = (
    annotation: Annotation,
    cache: PageAnnotationsCacheInterface,
): NoteData & NoteResult => {
    const lists =
        annotation.lists
            ?.map(
                (localListId) => cache.getListByLocalId(localListId)?.unifiedId,
            )
            .filter((id) => id != null) ?? []
    return {
        url: annotation.url,
        pageUrl: annotation.pageUrl,
        highlight: annotation.body,
        comment: annotation.comment,
        tags: annotation.tags ?? [],
        lists,
        selector: annotation.selector,
        color: annotation.color as RGBAColor,
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
            bodyInputValue: annotation.body ?? '',
            tags: annotation.tags ?? [],
            lists,
            isTagPickerShown: false,
            isListPickerShown: false,
            isShown: false,
        },
    }
}

export const pageSearchResultToState: SearchResultToState<StandardSearchResponse> = (
    result,
    cache,
    extraPageResultState,
) => {
    const pageData = initNormalizedState<PageData>()
    const noteData = initNormalizedState<NoteData & NoteResult>()
    const pageResults = initNormalizedState<PageResult>()

    for (const pageResult of result.docs) {
        const id = pageResult.url
        const sortedAnnots = pageResult.annotations.sort(sortByPagePosition)
        const noteIds = sortedAnnots.map((a) => a.url)

        pageData.byId[id] = pageResultToPageData(pageResult, cache)
        pageResults.byId[id] = getInitialPageResultState(
            pageResult.url,
            noteIds,
            extraPageResultState,
        )

        pageData.allIds.push(id)
        pageResults.allIds.push(id)

        for (const annotation of sortedAnnots) {
            noteData.allIds.push(annotation.url)
            noteData.byId[annotation.url] = annotationToNoteData(
                annotation,
                cache,
            )
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
