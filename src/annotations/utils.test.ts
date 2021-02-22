import { isUrlForAnnotation, generateUrl } from './utils'

const NORMALIZED_PAGE_URLS = [
    'getmemex.com',
    'getmemex.com/123',
    'getmemex.com/route',
    'getmemex.com/another_route#test',
    'getmemex.com/route?param_a=3&param+b=1',
]

describe('Annotation utility fns', () => {
    it('Should be able to correctly detect annotation URL IDs', () => {
        for (const pageUrl of NORMALIZED_PAGE_URLS) {
            expect(isUrlForAnnotation(pageUrl)).toBe(false)

            const annotUrl = generateUrl({ pageUrl, now: () => Date.now() })
            expect(isUrlForAnnotation(annotUrl)).toBe(true)
        }
    })
})
