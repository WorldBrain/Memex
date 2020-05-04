import { Annotation } from 'src/annotations/types'

export const COMMENT_1 = 'This is a test comment'
export const TAG_1 = 'tag 1'
export const TAG_2 = 'tag 2'
export const CURRENT_TAB_URL_1 = 'https://test.com'

export const ANNOT_1: Annotation = {
    url: CURRENT_TAB_URL_1 + '#123',
    pageUrl: CURRENT_TAB_URL_1,
    comment: COMMENT_1,
    lastEdited: new Date('2020-01-01').valueOf(),
    createdWhen: new Date('2020-01-01').valueOf(),
    selector: {} as any,
    tags: [],
}
