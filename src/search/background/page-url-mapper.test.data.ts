export const VISIT_3 = 1569260261209
export const VISIT_2 = VISIT_3 - 1000 * 60
export const VISIT_1 = VISIT_2 - 1000 * 60

export const BOOKMARK_1 = VISIT_1 + 1000 * 60 // Bookmark 1min after visit
export const BOOKMARK_2 = VISIT_2 + 1000 * 60

export const PAGE_1 = {
    url: 'http://lorem.com/test2',
    content: {
        fullText:
            'Lorem ipsum dolor sit amet, printing consectetur adipiscing elit.',
        title: 'page 3 dummy',
    },
}

export const PAGE_2 = {
    url: 'http://sub.lorem.com/test1',
    content: {
        fullText: 'Lorem Ipsum is simply dummy text of the printing industry',
        title: 'page 2',
    },
}

export const PAGE_3 = {
    url: 'http://sub.lorem.com/test3',
    content: {
        fullText: 'Lorem Ipsum is simply dummy text of the printing industry',
        title: 'page 2',
    },
}
