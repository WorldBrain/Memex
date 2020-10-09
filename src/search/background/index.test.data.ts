export const normalizedPageUrl1 = 'annotation.url'
export const fullPageUrl1 = `https://${normalizedPageUrl1}`

export const normalizedPageUrl2 = 'test.com/test'
export const fullPageUrl2 = `https://${normalizedPageUrl2}`

export const tag1 = 'tag1'
export const tag2 = 'tagwithahugename'

export const coll1 = 'testA'
export const coll2 = 'testB'

// - bookmarked
// - coll 2
export const highlight = {
    fullPageUrl: fullPageUrl1,
    object: {
        pageTitle: 'Annotation title',
        pageUrl: normalizedPageUrl1,
        body: 'Whooo this is a highlight',
        url: `${fullPageUrl1}/#12124124124`,
        comment: '',
        selector: {},
        createdWhen: new Date('2019-01-25T12:04Z'),
    },
}

// - bookmarked
// - coll 1
export const hybrid = {
    fullPageUrl: fullPageUrl2,
    object: {
        pageTitle: 'Annotation title',
        pageUrl: normalizedPageUrl2,
        body: 'Whooo this is a highlight bla',
        url: `${fullPageUrl2}#12124124124`,
        comment: 'Great quote in that highlight term',
        selector: {} as any,
        createdWhen: new Date('2019-01-30T13:02Z'),
    },
}

// - tag 1
// - tag 2
export const annotation = {
    fullPageUrl: fullPageUrl1,
    object: {
        pageTitle: 'Annotation title',
        pageUrl: normalizedPageUrl1,
        body: 'Whooo this is an annotation ',
        url: `${fullPageUrl1}/#12124124134`,
        comment: 'Hmm this is the annotation comment bla',
        selector: {},
        createdWhen: new Date('2019-01-29T18:42Z'),
    },
}

export const comment = {
    fullPageUrl: fullPageUrl1,
    object: {
        pageTitle: 'Annotation title',
        pageUrl: normalizedPageUrl1,
        body: 'some test text term',
        url: `${fullPageUrl1}/#12124124159`,
        comment: 'Hmm this is just a comment',
        selector: {},
        createdWhen: new Date('2019-01-28T07:01Z'),
    },
}
