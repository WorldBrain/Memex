import { FakeTab } from 'src/tab-management/background/index.tests'

export const VISIT_1 = 1569987718848

export const TAG_1 = 'test'
export const TAG_2 = 'test2'

export const PAGE_1 = {
    url: 'lorem.com',
    fullUrl: 'https://www.lorem.com',
    domain: 'lorem.com',
    hostname: 'lorem.com',
}

export const PAGE_2 = {
    url: 'test.com',
    fullUrl: 'https://www.test.com',
    domain: 'test.com',
    hostname: 'test.com',
}

export const ANNOT_1 = {
    url: PAGE_1.url + '#1',
    title: 'test',
    pageUrl: PAGE_1.url,
    comment: 'test comment',
    createdWhen: new Date(1570024800000),
}

export const ANNOT_2 = {
    url: PAGE_2.url + '#1',
    title: 'annotation',
    pageUrl: PAGE_2.url,
    comment: 'some test text',
    createdWhen: new Date(1570024800000),
}

export const HIGHLIGHT_1 = {
    url: PAGE_1.url + '#2',
    title: 'test',
    body: 'test body',
    pageUrl: PAGE_1.url,
    createdWhen: new Date(1570024800000),
}

export const TEST_TAB_1: FakeTab & { normalized: string } = {
    id: 1,
    url: 'https://www.lorem.com',
    normalized: 'lorem.com',
}

export const TEST_TAB_2: FakeTab & { normalized: string } = {
    id: 2,
    url: 'https://www.test.com',
    normalized: 'test.com',
}
