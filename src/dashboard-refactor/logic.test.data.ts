import { PageData, NoteData } from './search-results/types'
import {
    StandardSearchResponse,
    SearchResultPage,
} from 'src/search/background/types'
import { Annotation } from 'src/annotations/types'

interface TestMetadata {
    tags?: string[]
    lists?: number[]
}

const pageDataToSearchRes = (
    page: PageData,
    metadata?: TestMetadata & {
        notes?: Array<{ note: NoteData; metadata?: TestMetadata }>
    },
): SearchResultPage => ({
    url: page.normalizedUrl,
    fullUrl: page.fullUrl,
    fullTitle: page.fullTitle,
    // hasBookmark: false,
    // TODO : This type changed, though the tests aren't in a working state, so I'm just commenting it out for now. Needs to be fixed
    annotations: [],
    //     metadata?.notes?.map(({ note, metadata }) =>
    //         noteDataToSearchRes(note, page, metadata),
    //     ) ?? [],
    displayTime: page.displayTime,
    lists: metadata?.lists ?? [],
    text: page?.text ?? '',
    totalAnnotationsCount: 0,
})

const noteDataToSearchRes = (
    note: NoteData,
    page: PageData,
    metadata?: TestMetadata,
): Annotation => ({
    createdWhen: new Date(note.displayTime),
    lastEdited: note.isEdited ? new Date(note.displayTime) : undefined,
    isBulkShareProtected: note.isBulkShareProtected,
    isShared: note.isShared,
    pageUrl: page.normalizedUrl,
    comment: note.comment,
    body: note.highlight,
    url: note.url,
    lists: metadata?.lists ?? [],
    tags: metadata?.tags ?? [],
})

export const DAY_1 = new Date('2020-11-26').getTime()
export const DAY_2 = new Date('2020-11-27').getTime()

export const PAGE_1: PageData = {
    normalizedUrl: 'test.com',
    fullUrl: 'https://test.com',
    fullTitle: 'Test page',
    displayTime: new Date('2020-11-26T01:00').getTime(),
    hasNotes: true,
    lists: [],
    type: 'page',
    totalAnnotationCount: 0,
}

export const PAGE_2: PageData = {
    normalizedUrl: 'getmemex.com',
    fullUrl: 'https://getmemex.com',
    fullTitle: 'Memex ext is good',
    displayTime: new Date('2020-11-26T05:00').getTime(),
    hasNotes: false,
    lists: [],
    type: 'page',
    totalAnnotationCount: 0,
}

export const PAGE_3: PageData = {
    normalizedUrl: 'getmemex.com/sub',
    fullUrl: 'https://getmemex.com/sub',
    fullTitle: 'Memex ext is a web extension',
    displayTime: new Date('2020-11-26T05:10').getTime(),
    hasNotes: true,
    lists: [],
    type: 'page',
    totalAnnotationCount: 0,
}

export const NOTE_1: NoteData = {
    url: PAGE_1.normalizedUrl + '#0123456789',
    pageUrl: PAGE_1.normalizedUrl,
    displayTime: new Date('2020-11-26T01:05').getTime(),
    comment: 'Test webpage internet javascript',
    isBulkShareProtected: false,
    isShared: false,
    isEdited: true,
    tags: [],
    lists: [],
}

export const NOTE_2: NoteData = {
    url: PAGE_1.normalizedUrl + '#01234567811',
    pageUrl: PAGE_1.normalizedUrl,
    displayTime: new Date('2020-11-26T01:07').getTime(),
    comment: 'webpage internet javascript',
    highlight: 'Some test text',
    isBulkShareProtected: false,
    isShared: false,
    tags: [],
    lists: [],
}

export const NOTE_3: NoteData = {
    url: PAGE_1.normalizedUrl + '#0123456789123',
    pageUrl: PAGE_1.normalizedUrl,
    displayTime: new Date('2020-11-27T18:05').getTime(),
    comment: 'Test webpage internet javascript deer',
    isBulkShareProtected: false,
    isShared: false,
    isEdited: true,
    tags: [],
    lists: [],
}

export const NOTE_4: NoteData = {
    url: PAGE_3.normalizedUrl + '#012345678912213',
    pageUrl: PAGE_3.normalizedUrl,
    displayTime: new Date('2020-11-26T05:15').getTime(),
    comment: 'Memex is a web extensions',
    highlight: 'memex web extension chrome firefox browser',
    isBulkShareProtected: false,
    isShared: false,
    tags: [],
    lists: [],
}

export const NOTE_5: NoteData = {
    url: PAGE_3.normalizedUrl + '#012345678912309',
    pageUrl: PAGE_3.normalizedUrl,
    displayTime: new Date('2020-11-27T18:15').getTime(),
    highlight: 'memex deer duck garage',
    isBulkShareProtected: false,
    isShared: false,
    tags: [],
    lists: [],
}

export const LISTS_1 = [
    { id: 1, name: 'test 1' },
    { id: 2, name: 'test 2', remoteId: 'shared list 2' },
    { id: 3, name: 'test 3', remoteId: 'shared list 2' },
]

export const TAG_1 = 'test 1'
export const TAG_2 = 'test 2'
export const TAG_3 = 'test 3'

export const PAGE_SEARCH_RESULT_1: StandardSearchResponse = {
    docs: [
        pageDataToSearchRes(PAGE_1),
        pageDataToSearchRes(PAGE_2),
        pageDataToSearchRes(PAGE_3),
    ],
    resultsExhausted: false,
}

export const PAGE_SEARCH_RESULT_2: StandardSearchResponse = {
    docs: [
        pageDataToSearchRes(PAGE_1, {
            notes: [{ note: NOTE_1 }, { note: NOTE_2 }, { note: NOTE_3 }],
        }),
        pageDataToSearchRes(PAGE_2),
        pageDataToSearchRes(PAGE_3, {
            notes: [{ note: NOTE_4 }, { note: NOTE_5 }],
        }),
    ],
    resultsExhausted: false,
}

export const PAGE_SEARCH_RESULT_3: StandardSearchResponse = {
    docs: [
        pageDataToSearchRes(PAGE_1, {
            notes: [{ note: NOTE_1 }, { note: NOTE_2 }, { note: NOTE_3 }],
            lists: [LISTS_1[0].id, LISTS_1[1].id],
        }),
        pageDataToSearchRes(PAGE_2),
        pageDataToSearchRes(PAGE_3, {
            notes: [{ note: NOTE_4 }, { note: NOTE_5 }],
        }),
    ],
    resultsExhausted: false,
}

export const ANNOT_SEARCH_RESULT_1 = {
    isAnnotsSearch: true,
    resultsExhausted: false,
    docs: [
        pageDataToSearchRes(PAGE_1),
        pageDataToSearchRes(PAGE_2),
        pageDataToSearchRes(PAGE_3),
    ],
    annotsByDay: {
        [DAY_1]: {
            [PAGE_1.normalizedUrl]: [],
            [PAGE_2.normalizedUrl]: [],
            [PAGE_3.normalizedUrl]: [],
        },
    },
}

export const ANNOT_SEARCH_RESULT_2 = {
    isAnnotsSearch: true,
    resultsExhausted: false,
    docs: [
        pageDataToSearchRes(PAGE_1, {
            notes: [{ note: NOTE_1 }, { note: NOTE_2 }, { note: NOTE_3 }],
        }),
        pageDataToSearchRes(PAGE_2),
        pageDataToSearchRes(PAGE_3, {
            notes: [{ note: NOTE_4 }, { note: NOTE_5 }],
        }),
    ],
    annotsByDay: {
        [DAY_1]: {
            [PAGE_1.normalizedUrl]: [NOTE_1, NOTE_2].map((note) =>
                noteDataToSearchRes(note, PAGE_1),
            ),
            [PAGE_2.normalizedUrl]: [],
            [PAGE_3.normalizedUrl]: [NOTE_4].map((note) =>
                noteDataToSearchRes(note, PAGE_3),
            ),
        },
        [DAY_2]: {
            [PAGE_1.normalizedUrl]: [NOTE_3].map((note) =>
                noteDataToSearchRes(note, PAGE_1),
            ),
            [PAGE_3.normalizedUrl]: [NOTE_5].map((note) =>
                noteDataToSearchRes(note, PAGE_3),
            ),
        },
    },
}
