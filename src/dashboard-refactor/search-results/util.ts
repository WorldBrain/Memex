import {
    StandardSearchResponse,
    AnnotationsSearchResponse,
    AnnotsByPageUrl,
} from 'src/search/background/types'
import {
    PageData,
    NormalizedState,
    PageResult,
    PageResultsByDay,
    NoteData,
    SearchResultToState,
    NoteResult,
} from './types'

export const initNormalizedState = <T>(): NormalizedState<T> => ({
    allIds: [],
    byId: {},
})

export const getInitialPageResultState = (id: string): PageResult => ({
    id,
    notesType: 'user',
    areNotesShown: false,
    sortingFn: (a, b) => 1,
    loadNotesState: 'pristine',
    newNoteForm: { inputValue: '' },
    noteIds: { user: [], followed: [], search: [] },
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
        const pageResults = initNormalizedState<PageResult>()

        for (const [pageUrl, annotations] of Object.entries(annotsByPageUrl)) {
            pageResults.allIds.push(pageUrl)
            pageResults.byId[pageUrl] = getInitialPageResultState(pageUrl)

            for (const annotation of annotations) {
                pageResults.byId[pageUrl].noteIds.search.push(annotation.url)

                noteData.allIds.push(annotation.url)
                noteData.byId[annotation.url] = {
                    url: annotation.url,
                    highlight: annotation.body,
                    comment: annotation.comment,
                    displayTime:
                        annotation.lastEdited?.getTime() ??
                        annotation.createdWhen.getTime(),
                    commentEditValue: annotation.comment ?? '',
                    tags: annotation.tags ?? [],
                    isTagPickerShown: false,
                    isEditing: false,
                }
            }
        }

        resultState[day] = {
            day,
            pages: pageResults,
        }
    }

    for (const pageResult of result.docs) {
        const id = pageResult.url

        pageData.allIds.push(id)
        pageData.byId[id] = {
            title: pageResult.title,
            fullUrl: pageResult.url,
            normalizedUrl: pageResult.url,
            displayTime: pageResult.displayTime,
            isBookmarked: pageResult.hasBookmark,
        }
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

        pageData.byId[id] = {
            title: pageResult.title,
            fullUrl: pageResult.url,
            normalizedUrl: pageResult.url,
            displayTime: pageResult.displayTime,
            isBookmarked: pageResult.hasBookmark,
        }
        pageResults.byId[id] = getInitialPageResultState(pageResult.url)

        pageData.allIds.push(id)
        pageResults.allIds.push(id)

        for (const annotation of pageResult.annotations) {
            pageResults.byId[id].noteIds.search.push(annotation.url)

            noteData.allIds.push(annotation.url)
            noteData.byId[annotation.url] = {
                url: annotation.url,
                highlight: annotation.body,
                comment: annotation.comment,
                displayTime:
                    annotation.lastEdited?.getTime() ??
                    annotation.createdWhen.getTime(),
                commentEditValue: annotation.comment ?? '',
                tags: annotation.tags ?? [],
                isTagPickerShown: false,
                isEditing: false,
            }
        }
    }

    return {
        noteData,
        pageData,
        results: { [-1]: { day: -1, pages: pageResults } },
    }
}
