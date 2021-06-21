import * as DATA from 'src/tests/common-fixtures.data'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { Annotation } from 'src/annotations/types'
import moment from 'moment'
import { ReadwiseHighlight } from './types/api'
import { getAnchorSelector } from 'src/highlighting/utils'
export * from 'src/tests/common-fixtures.data'

export const ANNOT_1: Annotation = {
    url: DATA.PAGE_1.url + '#1111111111',
    body: 'Annotation body 1',
    pageTitle: 'test',
    pageUrl: normalizeUrl(DATA.PAGE_1.url),
    comment: 'test comment',
    selector: {
        quote: 'Annotation body 1',
        descriptor: {
            strategy: 'hyp-anchoring',
            content: [
                {
                    start: 10,
                    type: 'TextPositionSelector',
                },
            ],
        },
    },
    createdWhen: moment({
        year: 2020,
        month: 2,
        day: 2,
        hour: 16,
        minute: 0,
    }).toDate(),
    tags: [],
}
export const ANNOT_2: Annotation = {
    url: DATA.PAGE_2.url + '#1111111111',
    body: 'Annotation body 2',
    pageTitle: 'test 2',
    pageUrl: normalizeUrl(DATA.PAGE_2.url),
    comment: 'test comment 2',
    selector: {
        quote: 'Annotation body 2',
        descriptor: {
            strategy: 'hyp-anchoring',
            content: [
                {
                    start: 1000,
                    type: 'TextPositionSelector',
                },
            ],
        },
    },
    createdWhen: moment({
        year: 2020,
        month: 2,
        day: 2,
        hour: 16,
        minute: 0,
    }).toDate(),
    tags: [],
}

export const ANNOT_3: Annotation = {
    url: DATA.PAGE_2.url + '#1111111112',
    pageTitle: 'test 2',
    pageUrl: normalizeUrl(DATA.PAGE_2.url),
    comment: 'test comment 3',
    createdWhen: moment({
        year: 2021,
        month: 2,
        day: 2,
        hour: 16,
        minute: 0,
    }).toDate(),
    tags: [],
}

export const HIGHLIGHT_1 = (annotationUrl: string): ReadwiseHighlight => ({
    text: ANNOT_1.body,
    title: DATA.TEST_TAB_1.title,
    source_url: DATA.PAGE_1.fullUrl,
    source_type: 'article',
    note: ANNOT_1.comment,
    location: getAnchorSelector(ANNOT_1.selector, 'TextPositionSelector').start,
    location_type: 'order',
    highlighted_at: ANNOT_1.createdWhen,
    // highlight_url: annotationUrl,
})

export type UploadedReadwiseHighlight = Omit<
    ReadwiseHighlight,
    'highlighted_at'
> & { highlighted_at: string }

export const UPLOADED_HIGHLIGHT_1 = (
    annotationUrl: string,
): UploadedReadwiseHighlight => ({
    ...HIGHLIGHT_1(annotationUrl),
    highlighted_at: ANNOT_1.createdWhen.toISOString(),
    // highlight_url: annotationUrl,
})

export const UPLOADED_HIGHLIGHT_2 = (
    annotationUrl: string,
): UploadedReadwiseHighlight => ({
    text: ANNOT_2.body,
    title: DATA.TEST_TAB_2.title,
    source_url: DATA.PAGE_2.fullUrl,
    source_type: 'article',
    note: ANNOT_2.comment,
    location: getAnchorSelector(ANNOT_2.selector, 'TextPositionSelector').start,
    location_type: 'order',
    highlighted_at: ANNOT_2.createdWhen.toISOString(),
    // highlight_url: annotationUrl,
})

export const UPLOADED_HIGHLIGHT_3 = (
    annotationUrl: string,
): UploadedReadwiseHighlight => ({
    text: expect.any(String),
    title: DATA.TEST_TAB_2.title,
    source_url: DATA.PAGE_2.fullUrl,
    source_type: 'article',
    note: ANNOT_3.comment,
    location: undefined,
    location_type: 'order',
    highlighted_at: ANNOT_3.createdWhen.toISOString(),
    // highlight_url: annotationUrl,
})

export const UPLOAD_REQUEST = (params: {
    token: string
    highlights: UploadedReadwiseHighlight[]
}) => ({
    method: 'POST',
    headers: {
        Authorization: `Token ${params.token}`,
        'Content-Type': 'application/json',
    },
    body: {
        highlights: params.highlights,
    },
})
