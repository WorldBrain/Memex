export const VISIT_3 = Date.now()
export const VISIT_2 = VISIT_3 - 1000 * 60
export const VISIT_1 = VISIT_2 - 1000 * 60
export const BOOKMARK_1 = VISIT_3 - 1000 * 60 * 86400 // Bookmark from a day ago
export const PAGE_1 = {
    url: 'https://www.lorem.com/test2',
    content: {
        fullText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        title: 'test page 3 dummy',
    },
}
export const PAGE_2 = {
    url: 'https://www.lorem.com/test1',
    content: {
        fullText: 'Lorem Ipsum is simply dummy text of the printing industry',
        title: 'test page 2',
    },
}
export const PAGE_3 = {
    url: 'https://www.test.com/test',
    content: {
        fullText: 'the wild fox jumped over the hairy red hen',
        title: 'test page',
    },
}
export const PAGE_4 = { ...PAGE_3, url: 'https://test.com/tmp' }
