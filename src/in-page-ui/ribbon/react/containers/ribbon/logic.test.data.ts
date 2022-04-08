import type { Annotation } from 'src/annotations/types'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

export const PAGE_URL_1 = 'https://test.com'
export const COMMENT_1 = 'This is a test comment'
export const TAG_1 = 'tag 1'
export const TAG_2 = 'tag 2'
export const CURRENT_TAB_URL_1 = 'https://test.com'
export const CURRENT_TAB_TITLE_1 = 'Testing Site'
export const CURRENT_TAB_TITLE_2 = 'Better Testing Site'

export const ANNOT_1: Annotation = {
    url: normalizeUrl(CURRENT_TAB_URL_1) + '/#123',
    pageUrl: normalizeUrl(CURRENT_TAB_URL_1),
    pageTitle: CURRENT_TAB_TITLE_1,
    comment: COMMENT_1,
    lastEdited: new Date('2020-01-01'),
    createdWhen: new Date('2020-01-01'),
    tags: [],
    lists: [],
}

export const ANNOT_2: Annotation = {
    url: normalizeUrl(CURRENT_TAB_URL_1) + '/#124',
    pageUrl: normalizeUrl(CURRENT_TAB_URL_1),
    pageTitle: CURRENT_TAB_TITLE_2,
    body: 'test highlight',
    lastEdited: new Date('2022-04-03'),
    createdWhen: new Date('2022-04-03'),
    selector: {
        descriptor: { content: { type: 'TextPositionSelector' } },
    } as any,
    tags: [],
    lists: [],
}

export const LISTS_1 = [
    { id: 1, name: 'test 1' },
    { id: 2, name: 'test 2' },
    { id: 3, name: 'test 3' },
]
