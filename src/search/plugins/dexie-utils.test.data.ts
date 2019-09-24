export const VISIT_3 = 1569260261209
export const VISIT_2 = VISIT_3 - 1000 * 60
export const VISIT_1 = VISIT_2 - 1000 * 60

export const BOOKMARK_1 = VISIT_3 - 1000 * 60 * 86400 // Bookmark from a day ago

export const PAGE_1 = {
    url: 'http://lorem.com/test2',
    content: {
        fullText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
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

export const TAG_1 = 'tag 1'

export const ANNOT_1 = {
    createdWhen: new Date('2018-09-01T01:10'),
    body:
        'The English term "Victors\' justice" was first used by Richard Minear in his 1971 account of the International Military Tribunal for the Far East',
    pageTitle: "Victor's Justice",
    title: "Victor's Justice",
    url: 'http://lorem.com/test2/#1231231',
    pageUrl: 'http://lorem.com/test2',
}
