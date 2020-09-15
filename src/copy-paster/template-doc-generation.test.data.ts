import { normalizeUrl } from '@worldbrain/memex-url-utils'

export const testPageAUrl = 'https://test.com'
export const testPageATags = ['a', 'b', 'c']
export const testPageA = {
    url: normalizeUrl(testPageAUrl),
    fullUrl: testPageAUrl,
    fullTitle: 'test page A title',
}

export const testPageBUrl = 'https://test.com/sub'
export const testPageBTags = ['a', 'test']
export const testPageB = {
    url: normalizeUrl(testPageBUrl),
    fullUrl: testPageBUrl,
    fullTitle: 'test page B title',
}

// Children of page A
export const testAnnotationAUrl = 'test.com#1'
export const testAnnotationATags = ['a', 'tag']
export const testAnnotationAText = 'this is a comment on the annotation'
export const testAnnotationBUrl = 'test.com#2'
export const testAnnotationBTags = ['a']
export const testAnnotationBHighlight = 'this is a highlight from the webpage'

// Children of page B
export const testAnnotationCUrl = 'test.com#3'
export const testAnnotationCTags = ['z']
export const testAnnotationCHighlight =
    'this is another highlight from a webpage'
