import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

const protocolUrls = [
    'http://test.com',
    'https://test.com',
    'git://test.com',
    'ftp://test.com',
    'whatever://test.com',
]

const wwwSubUrl = 'https://www.test.com'
const trailingSlashUrls = protocolUrls.map((url) => url + '/')
const hashFragUrls = protocolUrls.map((url) => url + '#test')

describe('URL normalization tests', () => {
    it('should remove protocol', () => {
        for (const url of protocolUrls) {
            expect(normalizeUrl(url)).toEqual('test.com')
        }
    })

    it('should remove "www" subdomains', () => {
        expect(normalizeUrl(wwwSubUrl)).toEqual('test.com')
    })

    it('should remove trailing slashes', () => {
        for (const url of trailingSlashUrls) {
            expect(normalizeUrl(url)).toEqual('test.com')
        }
    })

    it('should remove hash fragments', () => {
        for (const url of hashFragUrls) {
            expect(normalizeUrl(url)).toEqual('test.com')
        }
    })

    describe('specific site query params normalization', () => {
        it('should remove all query params apart from "q" on google URLs', () => {
            const url =
                'https://www.google.com/search?q=test&client=firefox-b-d&start=40&biw=1752&bih=1167'
            expect(normalizeUrl(url)).toEqual('google.com/search?q=test')
        })

        it('should remove all query params apart from "q" on twitter URLs', () => {
            const url = 'https://twitter.com/search?q=test&src=typed_query'
            expect(normalizeUrl(url)).toEqual('twitter.com/search?q=test')
        })

        it('should keep all query params apart from "taken-by" on instagram URLs', () => {
            const url = 'https://www.instagram.com/?hl=en&taken-by=test'
            expect(normalizeUrl(url)).toEqual('instagram.com/?hl=en')
        })
    })
})
