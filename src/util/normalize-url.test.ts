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

    it('should normalize all types of youtube URLs to a single format', () => {
        let equivalentUrls = [
            'http://www.youtube.com/watch/-wtIMTCHWuI',
            'http://youtube.com/watch/-wtIMTCHWuI',
            'http://m.youtube.com/watch/-wtIMTCHWuI',
            'https://www.youtube.com/watch/-wtIMTCHWuI',
            'https://youtube.com/watch/-wtIMTCHWuI',
            'https://m.youtube.com/watch/-wtIMTCHWuI',

            'http://www.youtube.com/v/-wtIMTCHWuI',
            'http://youtube.com/v/-wtIMTCHWuI',
            'http://m.youtube.com/v/-wtIMTCHWuI',
            'https://www.youtube.com/v/-wtIMTCHWuI',
            'https://youtube.com/v/-wtIMTCHWuI',
            'https://m.youtube.com/v/-wtIMTCHWuI',

            'http://youtu.be/-wtIMTCHWuI',
            'https://youtu.be/-wtIMTCHWuI',
            'https://youtu.be/-wtIMTCHWuI?si=B_RZg_I-lLaa7UU-',
            'https://youtu.be/-wtIMTCHWuI?t=10',
            'https://youtu.be/-wtIMTCHWuI?t=10s',

            'http://www.youtube.com/watch?v=-wtIMTCHWuI',
            'http://youtube.com/watch?v=-wtIMTCHWuI',
            'http://m.youtube.com/watch?v=-wtIMTCHWuI',
            'http://m.youtube.com/watch?v=-wtIMTCHWuI&feature=em-uploademail',
            'http://m.youtube.com/watch?v=-wtIMTCHWuI&feature=channel',
            'http://m.youtube.com/watch?v=-wtIMTCHWuI#t=0m10s',
            'http://m.youtube.com/watch?v=-wtIMTCHWuI&playnext_from=TL&videos=osPknwzXEas&feature=sub',
            'http://m.youtube.com/watch?v=-wtIMTCHWuI&list=PLGup6kBfcU7Le5laEaCLgTKtlDcxMqGxZ&index=106&shuffle=2655',
            'https://www.youtube.com/watch?feature=player_embedded&v=-wtIMTCHWuI',

            'http://www.youtube.com/live/-wtIMTCHWuI',
            'http://youtube.com/live/-wtIMTCHWuI',
            'http://m.youtube.com/live/-wtIMTCHWuI',
            'https://www.youtube.com/live/-wtIMTCHWuI',
            'https://youtube.com/live/-wtIMTCHWuI',
            'https://m.youtube.com/live/-wtIMTCHWuI',

            'http://www.youtube.com/shorts/-wtIMTCHWuI',
            'http://youtube.com/shorts/-wtIMTCHWuI',
            'http://m.youtube.com/shorts/-wtIMTCHWuI',
            'https://www.youtube.com/shorts/-wtIMTCHWuI',
            'https://youtube.com/shorts/-wtIMTCHWuI',
            'https://m.youtube.com/shorts/-wtIMTCHWuI',
        ]

        for (let url of equivalentUrls) {
            expect(normalizeUrl(url)).toEqual('youtube.com/watch?v=-wtIMTCHWuI')
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

        it('should remove all query params apart from "img_index" on instagram URLs', () => {
            let urlA = 'https://www.instagram.com/?hl=en&taken-by=test&fake=foo'
            let urlB = 'https://www.instagram.com/p/C6M13dHL-zi/'
            let urlC = 'https://www.instagram.com/p/C6M13dHL-zi/?img_index=1'
            let urlD =
                'https://www.instagram.com/p/C6M13dHL-zi/?img_index=1&hl=en&taken-by=test'
            expect(normalizeUrl(urlA)).toEqual('instagram.com/')
            expect(normalizeUrl(urlB)).toEqual('instagram.com/p/C6M13dHL-zi')
            expect(normalizeUrl(urlC)).toEqual(
                'instagram.com/p/C6M13dHL-zi?img_index=1',
            )
            expect(normalizeUrl(urlD)).toEqual(
                'instagram.com/p/C6M13dHL-zi?img_index=1',
            )
        })
    })
})
