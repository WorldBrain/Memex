import { Annotation } from 'src/annotations/types'

export const PAGE_URL_1 = 'https://test.com'
export const COMMENT_1 = 'This is a test comment'
export const TAG_1 = 'tag 1'
export const TAG_2 = 'tag 2'
export const CURRENT_TAB_URL_1 = 'https://test.com'
export const CURRENT_TAB_TITLE_1 = 'Testing Site'

export const ANNOT_1: Annotation = {
    url: CURRENT_TAB_URL_1 + '#123',
    pageUrl: CURRENT_TAB_URL_1,
    pageTitle: CURRENT_TAB_TITLE_1,
    comment: COMMENT_1,
    lastEdited: new Date('2020-01-01'),
    createdWhen: new Date('2020-01-01'),
    selector: {} as any,
    tags: [],
}
