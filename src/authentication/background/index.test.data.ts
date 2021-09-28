export const PAGE_1 = {
    url: 'test.com',
    domain: 'test.com',
    hostname: 'test.com',
    fullUrl: 'http://test.com',
    canonicalUrl: 'http://test.com',
    fullTitle: 'Test Page',
}

export const ANNOTATION_1 = {
    url: PAGE_1.url + '/#123',
    pageUrl: PAGE_1.url,
    pageTitle: PAGE_1.fullTitle,
    comment: 'This is a test note',
    createdWhen: new Date(),
    lastEdited: new Date(),
}

export const TAGS_1 = ['a', 'b', 'c']
export const TAGS_2 = ['aa', 'bb', 'cc']

export const USER_1 = {
    id: 'another-user@gmail.com',
    email: 'another-user@gmail.com',
}
