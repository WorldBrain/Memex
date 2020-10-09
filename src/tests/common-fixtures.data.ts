import { StorageCollectionDiff } from './storage-change-detector'
import { FakeTab } from 'src/tab-management/background/index.tests'

export const BOOKMARK_1 = 1569988361928
export const VISIT_1 = 1569987718848
export const VISIT_2 = 1569987718948
export const VISIT_3 = 1569989800000
export const VISIT_4 = 1569982122200
export const VISIT_5 = 1569984425254
export const TAG_1 = 'tag-1'

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

export const PAGE_1_CREATION: StorageCollectionDiff = {
    [PAGE_1.url]: {
        type: 'create',
        object: {
            url: PAGE_1.url,
            fullUrl: PAGE_1.fullUrl,
            domain: PAGE_1.domain,
            hostname: PAGE_1.hostname,
            text: 'Body 1',
            terms: expect.any(Array),
            urlTerms: [],
        },
    },
}

export const PAGE_2_CREATION: StorageCollectionDiff = {
    [PAGE_2.url]: {
        type: 'create',
        object: {
            url: PAGE_2.url,
            fullUrl: PAGE_2.fullUrl,
            domain: PAGE_2.domain,
            hostname: PAGE_2.hostname,
            text: 'Body 2',
            terms: expect.any(Array),
            urlTerms: [],
        },
    },
}

export const TEST_TAB_1: FakeTab & { normalized: string } = {
    id: 1,
    url: PAGE_1.fullUrl,
    normalized: PAGE_1.url,
}

export const TEST_TAB_2: FakeTab & { normalized: string } = {
    id: 2,
    url: PAGE_2.fullUrl,
    normalized: PAGE_2.url,
}
