import { PageData } from './types'
import {
    StandardSearchResponse,
    AnnotPage,
    AnnotationsSearchResponse,
} from 'src/search/background/types'
import { Annotation } from 'src/annotations/types'

export const DAY_1 = new Date('2020-11-26').getTime()

export const PAGE_1: PageData = {
    normalizedUrl: 'test.com',
    fullUrl: 'https://test.com',
    isBookmarked: false,
    title: 'Test page',
    displayTime: new Date('2020-11-26T01:00').getTime(),
}

export const PAGE_2: PageData = {
    normalizedUrl: 'getmemex.com',
    fullUrl: 'https://getmemex.com',
    isBookmarked: false,
    title: 'Memex ext is good',
    displayTime: new Date('2020-11-26T05:00').getTime(),
}

export const PAGE_3: PageData = {
    normalizedUrl: 'getmemex.com/sub',
    fullUrl: 'https://getmemex.com/sub',
    isBookmarked: false,
    title: 'Memex ext is a web extension',
    displayTime: new Date('2020-11-26T05:10').getTime(),
}

const pageDataToSearchRes = (
    page: PageData,
    annotations: Annotation[] = [],
): AnnotPage => ({
    url: page.normalizedUrl,
    title: page.title,
    hasBookmark: page.isBookmarked,
    annotations,
    annotsCount: annotations.length,
    displayTime: page.displayTime,
})

export const PAGE_SEARCH_RESULT_1: StandardSearchResponse = {
    docs: [PAGE_1, PAGE_2, PAGE_3].map((data) => pageDataToSearchRes(data)),
    resultsExhausted: false,
}

export const ANNOT_SEARCH_RESULT_1: AnnotationsSearchResponse = {
    isAnnotsSearch: true,
    resultsExhausted: false,
    docs: [PAGE_1, PAGE_2, PAGE_3].map((data) => pageDataToSearchRes(data)),
    annotsByDay: {
        [DAY_1]: {
            [PAGE_1.normalizedUrl]: [],
            [PAGE_2.normalizedUrl]: [],
            [PAGE_3.normalizedUrl]: [],
        },
    },
}
