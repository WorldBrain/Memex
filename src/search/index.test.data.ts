export const VISIT_3 = Date.now()
export const VISIT_2 = VISIT_3 - 1000 * 60
export const VISIT_1 = VISIT_2 - 1000 * 60
export const BOOKMARK_1 = VISIT_3 - 1000 * 60 * 86400 // Bookmark from a day ago
export const PAGE_1 = {
    url: 'https://www.lorem.com/test2',
    content: {
        fullText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        title: 'page 3 dummy',
    },
}
export const PAGE_2 = {
    url: 'https://sub.lorem.com/test1',
    content: {
        fullText: 'Lorem Ipsum is simply dummy text of the printing industry',
        title: 'page 2',
    },
}
export const PAGE_3 = {
    url: 'https://www.test.com/test',
    content: {
        fullText: 'the wild fox jumped over the hairy red hen',
        title: 'page',
    },
}
export const PAGE_4 = { ...PAGE_3, url: 'https://test.com/tmp' }

export const PAGE_ID_1 = 'lorem.com/test2'
export const PAGE_ID_2 = 'sub.lorem.com/test1'
export const PAGE_ID_3 = 'test.com/test'
export const PAGE_ID_4 = 'test.com/tmp'

// single coloured pixel via http://png-pixel.com/
export const FAV_1 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
