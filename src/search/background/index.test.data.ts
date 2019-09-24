// - bookmarked
export const directLink = {
    pageTitle: 'Some random page',
    pageUrl: 'somerandomurl.com',
    url: 'http://memex.link/3234235/',
    body: 'Some random quote in some random page term',
    comment: '',
    selector: {},
    createdWhen: new Date('2019-01-29T02:14Z'),
}

export const pageUrl = 'annotation.url'

export const tag1 = 'tag1'
export const tag2 = 'tagwithahugename'

export const coll1 = 'testA'
export const coll2 = 'testB'

// - bookmarked
// - coll 2
export const highlight = {
    pageTitle: 'Annotation title',
    pageUrl,
    body: 'Whooo this is a highlight',
    url: 'https://annotation.url/#12124124124',
    comment: '',
    selector: {},
    createdWhen: new Date('2019-01-25T12:04Z'),
}

// - bookmarked
// - coll 1
export const hybrid = {
    pageTitle: 'Annotation title',
    pageUrl: 'test.com/test',
    body: 'Whooo this is a highlight bla',
    url: 'https://test.com/test#12124124124',
    comment: 'Great quote in that highlight term',
    selector: {},
    createdWhen: new Date('2019-01-30T13:02Z'),
}

// - tag 1
// - tag 2
export const annotation = {
    pageTitle: 'Annotation title',
    pageUrl,
    body: 'Whooo this is an annotation ',
    url: 'https://annotation.url/#12124124134',
    comment: 'Hmm this is the annotation comment bla',
    selector: {},
    createdWhen: new Date('2019-01-29T18:42Z'),
}

export const comment = {
    pageTitle: 'Annotation title',
    pageUrl,
    body: 'some test text term',
    url: 'https://annotation.url/#12124124159',
    comment: 'Hmm this is just a comment',
    selector: {},
    createdWhen: new Date('2019-01-28T07:01Z'),
}
