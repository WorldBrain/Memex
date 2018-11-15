import * as expect from 'expect'
import { DownloadQueue } from './download-queue'

export function createMockFetcher() {
    const urls = { one: 'foo!', two: 'bar!', three: 'spam!' }
    const self = {
        resolveFetch: null,
        fetch: null,
        urls,
        downloading: {},
        downloaded: {},
    }
    const fetcher = url => {
        return new Promise(resolve => {
            self.downloading[url] = true
            self.resolveFetch = () => {
                self.downloading[url] = false
                self.downloaded[url] = true
                self.resolveFetch = null
                resolve(urls[url])
            }
        })
    }
    self.fetch = fetcher
    return self
}

describe('DownloadQueue', () => {
    it('should already be fetching the first URL when constructed', async () => {
        const mockFetcher = createMockFetcher()
        const queue = new DownloadQueue({
            urls: Object.keys(mockFetcher.urls),
            fetcher: mockFetcher.fetch,
        })
        expect(queue.hasNext()).toBe(true)
        expect(mockFetcher).toEqual(
            expect.objectContaining({
                downloading: { one: true },
                downloaded: {},
            }),
        )
    })

    it('should immediately return a result if already fetched and start downloading the next one when I retrieve the first', async () => {
        const mockFetcher = createMockFetcher()
        const queue = new DownloadQueue({
            urls: Object.keys(mockFetcher.urls),
            fetcher: mockFetcher.fetch,
        })
        expect(queue.hasNext()).toBe(true)
        expect(mockFetcher).toEqual(
            expect.objectContaining({
                downloading: { one: true },
                downloaded: {},
            }),
        )

        mockFetcher.resolveFetch()
        expect(queue.hasNext()).toBe(true)
        const first = await queue.getNext()
        expect(mockFetcher).toEqual(
            expect.objectContaining({
                downloading: { one: false, two: true },
                downloaded: { one: true },
            }),
        )
        expect(first).toEqual('foo!')
    })

    it('should not download more than one item ahead', async () => {
        const mockFetcher = createMockFetcher()
        const queue = new DownloadQueue({
            urls: Object.keys(mockFetcher.urls),
            fetcher: mockFetcher.fetch,
        })
        expect(queue.hasNext()).toBe(true)
        expect(mockFetcher).toEqual(
            expect.objectContaining({
                downloading: { one: true },
                downloaded: {},
            }),
        )

        mockFetcher.resolveFetch()
        expect(queue.hasNext()).toBe(true)
        const first = await queue.getNext()
        expect(mockFetcher).toEqual(
            expect.objectContaining({
                downloading: { one: false, two: true },
                downloaded: { one: true },
            }),
        )
        mockFetcher.resolveFetch()
        expect(mockFetcher).toEqual(
            expect.objectContaining({
                downloading: { one: false, two: false },
                downloaded: { one: true, two: true },
            }),
        )
    })
})
