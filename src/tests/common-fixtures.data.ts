import { StorageCollectionDiff } from './storage-change-detector'

export const VISIT_1 = 1569987718848
export const VISIT_2 = 1569987718948

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
            urlTerms: [],
        },
    },
}
