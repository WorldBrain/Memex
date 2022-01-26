import { normalizeUrl } from '@worldbrain/memex-url-utils'
import {
    FingerprintSchemeType,
    ContentLocatorFormat,
    LocationSchemeType,
    ContentLocatorType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'

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

export const testPageCUrl = 'https://memex.cloud/ct/test-fingerprint-a.pdf'
export const testPageCTags = ['ttt']
export const testPageC = {
    url: normalizeUrl(testPageCUrl),
    fullUrl: testPageCUrl,
    fullTitle: 'test PDF C title',
}
export const testLocatorC = {
    normalizedUrl: testPageC.url,
    location: 'test.com/test.pdf',
    originalLocation: 'https://test.com/test.pdf',
    fingerprint: 'test-fingerprint-a',
    fingerprintScheme: FingerprintSchemeType.PdfV1,
    format: ContentLocatorFormat.PDF,
    lastVisited: 1641443837993,
    locationScheme: LocationSchemeType.FilesystemPathV1,
    locationType: ContentLocatorType.Remote,
    primary: true,
    valid: true,
    version: 0,
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

// Children of page C
export const testAnnotationDUrl = testPageC.url + '#3'
export const testAnnotationDTags = ['t1', 't2']
export const testAnnotationDHighlight = 'this is another highlight from a PDF'
