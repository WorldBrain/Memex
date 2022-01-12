import { maybeIndexTabs } from './utils'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'

const testTabs = [
    {
        id: 120,
        url: 'chrome://extensions',
    },
    {
        id: 121,
        url: 'about:addons',
    },
    {
        id: 174,
        url:
            'chrome-extension://bchcdcdmibkfclblifbckgodmbbdjfff/options.html#/overview',
    },
    {
        id: 175,
        url:
            'moz-extension://64a850fc-2455-bf42-9c3d-1621b3a75480/options.html#/overview',
    },
    {
        id: 176,
        url: 'https://en.wikipedia.org/wiki/Memex#memex-tutorial',
    },

    {
        id: 177,
        url: 'http://mysite.com',
    },
    {
        id: 178,
        url:
            'chrome-extension://bchcdcdmibkfclblifbckgodmbbdjfff/pdfjs/viewer.html?file=https%3A%2F%2Fwww.test.com%2Ftest.pdf',
    },
    {
        id: 179,
        url:
            'chrome-extension://bchcdcdmibkfclblifbckgodmbbdjfff/pdfjs/viewer.html?file=file%3A%2F%2F%2FUsers%2Ftest%2Ftest.pdf',
    },
    {
        id: 191,
        url: 'file:///Users/test/test.pdf',
    },
]

describe('open tabs-based indexing tests', () => {
    it('should skip processing tabs with unsupported URLs types', async () => {
        const processed = await maybeIndexTabs(testTabs, {
            time: '$now',
            createPage: async () => undefined,
            waitForContentIdentifier: (async (a) => a) as any,
        })

        expect(processed).toEqual([
            { fullUrl: getUnderlyingResourceUrl(testTabs[4].url) },
            { fullUrl: getUnderlyingResourceUrl(testTabs[5].url) },
            { fullUrl: getUnderlyingResourceUrl(testTabs[6].url) },
            { fullUrl: getUnderlyingResourceUrl(testTabs[7].url) },
        ])
    })
})
