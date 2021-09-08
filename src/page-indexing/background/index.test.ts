import { setupBackgroundIntegrationTest } from '../../tests/background-integration-tests'
import {
    FingerprintSchemeType,
    ContentLocatorType,
    ContentLocatorFormat,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { injectFakeTabs } from '../../tab-management/background/index.tests'

describe('Page indexing background', () => {
    it('should generate and remember normalized URLs for local PDFs', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const fullUrl = 'file:////home/bla/test.pdf'
        const contentSize = 456
        const fingerprints = [
            {
                fingerprintScheme: FingerprintSchemeType.PdfV1,
                fingerprint: 'goldfinger',
            },
            {
                fingerprintScheme: FingerprintSchemeType.PdfV1,
                fingerprint: 'billfingers',
            },
        ]
        const locator = {
            contentSize,
            format: ContentLocatorFormat.PDF,
            originalLocation: fullUrl,
        }
        const identifier = await setup.backgroundModules.pages.initContentIdentifier(
            {
                locator,
                fingerprints,
            },
        )
        expect(identifier).toEqual({
            normalizedUrl: 'memex.cloud/ct/1337.pdf',
            fullUrl: 'https://memex.cloud/ct/1337.pdf',
        })
        injectFakeTabs({
            tabManagement: setup.backgroundModules.tabManagement,
            tabsAPI: setup.browserAPIs.tabs,
            tabs: [
                {
                    url: fullUrl,
                },
            ],
        })
        expect(
            await setup.storageManager.collection('locators').findObjects({}),
        ).toEqual([])
        await setup.backgroundModules.bookmarks.addBookmark({
            url: identifier.normalizedUrl,
            fullUrl: identifier.fullUrl,
        })
        const common = {
            contentSize,
            fingerprintScheme: 'x-pdf-v1',
            format: 'pdf',
            lastVisited: expect.any(Number),
            location: 'file:////home/bla/test.pdf',
            locationScheme: 'filesystem-path-v1',
            locationType: 'local',
            normalizedUrl: 'memex.cloud/ct/1337.pdf',
            originalLocation: 'file:////home/bla/test.pdf',
            primary: true,
            valid: true,
            version: 0,
        }
        expect(
            await setup.storageManager
                .collection('locators')
                .findObjects({}, { order: [['fingerprint', 'desc']] }),
        ).toEqual([
            {
                id: 1,
                fingerprint: 'goldfinger',
                ...common,
            },
            {
                id: 2,
                contentSize,
                fingerprint: 'billfingers',
                ...common,
            },
        ])
        expect(
            await setup.storageManager.collection('pages').findObjects({}),
        ).toEqual([
            expect.objectContaining({
                url: identifier.normalizedUrl,
                fullUrl: identifier.fullUrl,
            }),
        ])
        expect(
            await setup.storageManager.collection('bookmarks').findObjects({}),
        ).toEqual([
            {
                url: identifier.normalizedUrl,
                time: expect.any(Number),
            },
        ])
        expect(
            await setup.storageManager.collection('visits').findObjects({}),
        ).toEqual([
            {
                url: identifier.normalizedUrl,
                time: expect.any(Number),
            },
        ])
    })
})
