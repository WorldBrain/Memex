import { Page } from './types'

export const PAGE_1: Page = {
    normalizedUrl: 'test.com',
    fullUrl: 'https://test.com',
    isBookmarked: false,
    title: 'Test page',
    createdAt: new Date('2020-11-26T01:00'),
}

export const PAGE_2: Page = {
    normalizedUrl: 'getmemex.com',
    fullUrl: 'https://getmemex.com',
    isBookmarked: false,
    title: 'Memex ext is good',
    createdAt: new Date('2020-11-26T05:00'),
}

export const PAGE_3: Page = {
    normalizedUrl: 'getmemex.com/sub',
    fullUrl: 'https://getmemex.com/sub',
    isBookmarked: false,
    title: 'Memex ext is a web extension',
    createdAt: new Date('2020-11-26T05:10'),
}
