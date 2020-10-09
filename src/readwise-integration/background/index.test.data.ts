import * as DATA from 'src/tests/common-fixtures.data'
export * from 'src/tests/common-fixtures.data'

export const ANNOT_1 = {
    url: DATA.PAGE_1.url + '#1',
    title: 'test',
    pageUrl: DATA.PAGE_1.url,
    comment: 'test comment',
    createdWhen: new Date(1570024800000),
}
export const ANNOT_2 = {
    url: DATA.PAGE_2.url + '#1',
    title: 'test 2',
    pageUrl: DATA.PAGE_2.url,
    comment: 'test comment 2',
    createdWhen: new Date(1570025100000),
}

export const READWISE_ANNOT_1 = {
    localId: ANNOT_1.url,
}
