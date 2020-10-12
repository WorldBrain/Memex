import * as DATA from 'src/tests/common-fixtures.data'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { Annotation } from 'src/annotations/types'
import moment from 'moment'
export * from 'src/tests/common-fixtures.data'

export const ANNOT_1: Annotation = {
    url: DATA.PAGE_1.url + '#1',
    body: 'Annotation body 1',
    pageTitle: 'test',
    pageUrl: normalizeUrl(DATA.PAGE_1.url),
    comment: 'test comment',
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
    url: DATA.PAGE_2.url + '#1',
    body: 'Annotation body 2',
    pageTitle: 'test 2',
    pageUrl: normalizeUrl(DATA.PAGE_2.url),
    comment: 'test comment 2',
    createdWhen: moment({
        year: 2020,
        month: 2,
        day: 2,
        hour: 16,
        minute: 0,
    }).toDate(),
    tags: [],
}

export const READWISE_ANNOT_1 = {
    localId: ANNOT_1.url,
}
