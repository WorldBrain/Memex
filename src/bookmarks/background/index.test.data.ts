import { FakeTab } from 'src/tab-management/background/index.tests'

export const BOOKMARK_1 = 1569988361928
export const VISIT_1 = 1569987718848

export const PAGE_1 = {
    url: 'lorem.com',
    fullUrl: 'https://www.lorem.com',
    domain: 'lorem.com',
    hostname: 'lorem.com',
    content: {
        fullText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        title: 'dummy page',
    },
}

export const TEST_TAB_1: FakeTab & { normalized: string } = {
    id: 1,
    url: 'https://www.lorem.com',
    normalized: 'lorem.com',
}
