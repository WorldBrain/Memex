import { setupBackgroundIntegrationTest } from '../../tests/background-integration-tests'
import { indexTestFingerprintedPdf } from './index.tests'
import {
    LocationSchemeType,
    ContentLocatorType,
    FingerprintSchemeType,
    ContentLocatorFormat,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

describe('Page indexing background', () => {
    it('should generate and remember normalized URLs for local PDFs', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const url = 'file:///home/bla/test.pdf'
        const tabId = 1
        const {
            identifier,
            contentSize,
            fingerprints,
        } = await indexTestFingerprintedPdf(setup, { fullUrl: url, tabId })

        await setup.backgroundModules.bookmarks.addBookmark({
            url: identifier.normalizedUrl,
            fullUrl: identifier.fullUrl,
            tabId,
        })
        const common = {
            contentSize,
            fingerprintScheme: FingerprintSchemeType.PdfV1,
            format: ContentLocatorFormat.PDF,
            lastVisited: expect.any(Number),
            location: normalizeUrl(url),
            locationScheme: LocationSchemeType.FilesystemPathV1,
            locationType: ContentLocatorType.Local,
            normalizedUrl: `memex.cloud/ct/${fingerprints[0].fingerprint}.pdf`,
            originalLocation: url,
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
                fingerprint: fingerprints[0].fingerprint,
                ...common,
            },
            {
                id: 2,
                contentSize,
                fingerprint: fingerprints[1].fingerprint,
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

    it('should generate and remember normalized URLs for remote PDFs', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const url = 'https://home.com/bla/test.pdf'
        const tabId = 1
        const {
            identifier,
            contentSize,
            fingerprints,
        } = await indexTestFingerprintedPdf(setup, { fullUrl: url, tabId })

        await setup.backgroundModules.bookmarks.addBookmark({
            url: identifier.normalizedUrl,
            fullUrl: identifier.fullUrl,
            tabId,
        })
        const common = {
            contentSize,
            fingerprintScheme: FingerprintSchemeType.PdfV1,
            format: ContentLocatorFormat.PDF,
            lastVisited: expect.any(Number),
            location: normalizeUrl(url),
            locationScheme: LocationSchemeType.NormalizedUrlV1,
            locationType: ContentLocatorType.Remote,
            normalizedUrl: `memex.cloud/ct/${fingerprints[0].fingerprint}.pdf`,
            originalLocation: url,
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
                fingerprint: fingerprints[0].fingerprint,
                ...common,
            },
            {
                id: 2,
                contentSize,
                fingerprint: fingerprints[1].fingerprint,
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
