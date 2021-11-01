import { PAGE_1, PAGE_2 } from 'src/tests/common-fixtures.data'
export {
    TEST_TAB_1,
    TEST_TAB_2,
    PAGE_1,
    PAGE_2,
} from 'src/tests/common-fixtures.data'

export const VISIT_1 = 1569987718848

export const TAG_1 = 'test'
export const TAG_2 = 'test2'

export const ANNOT_1 = {
    url: PAGE_1.url + '/#1',
    title: PAGE_1.title,
    pageUrl: PAGE_1.url,
    comment: 'test comment',
    createdWhen: new Date(1570024800000),
}

export const ANNOT_2 = {
    url: PAGE_2.url + '/#2',
    title: PAGE_2.title,
    pageUrl: PAGE_2.url,
    comment: 'some test text',
    createdWhen: new Date(1570024800000),
}

export const HIGHLIGHT_1 = {
    url: PAGE_1.url + '/#3',
    title: PAGE_1.title,
    body: 'test body',
    pageUrl: PAGE_1.url,
    createdWhen: new Date(1570024800000),
}
