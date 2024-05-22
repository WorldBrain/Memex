import { setupBackgroundIntegrationTest } from '../../tests/background-integration-tests'
import { indexTestFingerprintedPdf } from './index.tests'
import {
    LocationSchemeType,
    ContentLocatorType,
    FingerprintSchemeType,
    ContentLocatorFormat,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { extractUrlParts } from '@worldbrain/memex-common/lib/url-utils/extract-parts'

describe('Page indexing background', () => {
    it.skip('should generate and remember normalized URLs for local PDFs', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const url = 'file:///home/bla/test.pdf'
        const tabId = 1
        const {
            identifier,
            contentSize,
            fingerprints,
        } = await indexTestFingerprintedPdf(setup, { fullUrl: url, tabId })

        const commonLocator = {
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

        const expectedContentInfo = expect.objectContaining({
            asOf: expect.any(Number),
            primaryIdentifier: {
                normalizedUrl: commonLocator.normalizedUrl,
                fullUrl: 'https://' + commonLocator.normalizedUrl,
            },
            aliasIdentifiers: [
                {
                    normalizedUrl: normalizeUrl(url),
                    fullUrl: url,
                },
            ],
            locators: expect.arrayContaining([
                {
                    fingerprint: fingerprints[0].fingerprint,
                    ...commonLocator,
                },
                {
                    fingerprint: fingerprints[1].fingerprint,
                    ...commonLocator,
                },
            ]),
        })

        expect(
            await setup.backgroundModules.pages.options.pageIndexingSettingsStore.get(
                'pageContentInfo',
            ),
        ).toEqual({
            [normalizeUrl(url)]: expectedContentInfo,
            [commonLocator.normalizedUrl]: expectedContentInfo,
        })

        await setup.backgroundModules.bookmarks.addBookmark({
            url: identifier.normalizedUrl,
            fullUrl: identifier.fullUrl,
            tabId,
        })

        expect(
            await setup.backgroundModules.pages.options.pageIndexingSettingsStore.get(
                'pageContentInfo',
            ),
        ).toEqual({
            [normalizeUrl(url)]: expectedContentInfo,
            [commonLocator.normalizedUrl]: expectedContentInfo,
        })

        expect(
            await setup.storageManager.collection('locators').findObjects({}),
        ).toEqual(
            expect.arrayContaining([
                {
                    id: expect.anything(),
                    fingerprint: fingerprints[0].fingerprint,
                    ...commonLocator,
                },
                {
                    id: expect.anything(),
                    fingerprint: fingerprints[1].fingerprint,
                    ...commonLocator,
                },
            ]),
        )
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

    it.skip('should generate and remember normalized URLs for local PDFs refered to via object URLs', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const fullUrlA =
            'blob:chrome-extension://bchcdcdmibkfclblifbckgodmbbdjfff/ce6ee4e9-7156-4d0d-a349-ded7d3f3c84b'
        const fullUrlB =
            'blob:chrome-extension://bchcdcdmibkfclblifbckgodmbbdjfff/ce6ee4e9-7156-4d0d-a349-ded7d3f3c84c'
        const tabId = 1
        const {
            identifier,
            contentSize,
            fingerprints,
        } = await indexTestFingerprintedPdf(setup, { fullUrl: fullUrlA, tabId })

        const masterLocatorUrl = `memex.cloud/ct/${fingerprints[0].fingerprint}.pdf`
        const urlParts = extractUrlParts(masterLocatorUrl)
        const createLocator = (fullUrl: string) => ({
            contentSize,
            fingerprintScheme: FingerprintSchemeType.PdfV1,
            format: ContentLocatorFormat.PDF,
            lastVisited: expect.any(Number),
            location: fullUrl,
            locationScheme: LocationSchemeType.FilesystemPathV1,
            locationType: ContentLocatorType.Local,
            normalizedUrl: masterLocatorUrl,
            originalLocation: fullUrl,
            primary: true,
            valid: true,
            version: 0,
        })

        const getExpectedContentInfo = (fullUrl: string) =>
            expect.objectContaining({
                asOf: expect.any(Number),
                primaryIdentifier: {
                    normalizedUrl: masterLocatorUrl,
                    fullUrl: 'https://' + masterLocatorUrl,
                },
                aliasIdentifiers: [
                    {
                        normalizedUrl: fullUrl,
                        fullUrl,
                    },
                ],
                locators: expect.arrayContaining([
                    {
                        fingerprint: fingerprints[0].fingerprint,
                        ...createLocator(fullUrl),
                    },
                    {
                        fingerprint: fingerprints[1].fingerprint,
                        ...createLocator(fullUrl),
                    },
                ]),
            })

        // Indexing the same PDF at a different object URL shouldn't result in extra data
        await indexTestFingerprintedPdf(setup, { fullUrl: fullUrlB, tabId })

        expect(
            await setup.backgroundModules.pages.options.pageIndexingSettingsStore.get(
                'pageContentInfo',
            ),
        ).toEqual({
            [fullUrlA]: getExpectedContentInfo(fullUrlA),
            [fullUrlB]: getExpectedContentInfo(fullUrlB),
            [masterLocatorUrl]: getExpectedContentInfo(fullUrlB),
        })

        await setup.backgroundModules.bookmarks.addBookmark({
            url: identifier.normalizedUrl,
            fullUrl: identifier.fullUrl,
            tabId,
        })

        expect(
            await setup.backgroundModules.pages.options.pageIndexingSettingsStore.get(
                'pageContentInfo',
            ),
        ).toEqual({
            [fullUrlA]: getExpectedContentInfo(fullUrlA),
            [fullUrlB]: getExpectedContentInfo(fullUrlB),
            [masterLocatorUrl]: getExpectedContentInfo(fullUrlB),
        })

        expect(
            await setup.storageManager.collection('locators').findObjects({}),
        ).toEqual(
            expect.arrayContaining([
                {
                    id: expect.anything(),
                    fingerprint: fingerprints[0].fingerprint,
                    ...createLocator(fullUrlB),
                },
                {
                    id: expect.anything(),
                    fingerprint: fingerprints[1].fingerprint,
                    ...createLocator(fullUrlB),
                },
            ]),
        )
        expect(
            await setup.storageManager.collection('pages').findObjects({}),
        ).toEqual([
            expect.objectContaining({
                url: identifier.normalizedUrl,
                fullUrl: identifier.fullUrl,
                hostname: urlParts.hostname,
                domain: urlParts.domain,
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

    it.skip('should generate and remember normalized URLs for remote PDFs', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const url = 'https://home.com/bla/test.pdf'
        const urlParts = extractUrlParts(url)
        const tabId = 1
        const {
            identifier,
            contentSize,
            fingerprints,
        } = await indexTestFingerprintedPdf(setup, { fullUrl: url, tabId })

        const commonLocator = {
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

        const expectedContentInfo = expect.objectContaining({
            asOf: expect.any(Number),
            primaryIdentifier: {
                normalizedUrl: commonLocator.normalizedUrl,
                fullUrl: 'https://' + commonLocator.normalizedUrl,
            },
            aliasIdentifiers: [
                {
                    normalizedUrl: normalizeUrl(url),
                    fullUrl: url,
                },
            ],
            locators: expect.arrayContaining([
                {
                    fingerprint: fingerprints[0].fingerprint,
                    ...commonLocator,
                },
                {
                    fingerprint: fingerprints[1].fingerprint,
                    ...commonLocator,
                },
            ]),
        })

        expect(
            await setup.backgroundModules.pages.options.pageIndexingSettingsStore.get(
                'pageContentInfo',
            ),
        ).toEqual({
            [normalizeUrl(url)]: expectedContentInfo,
            [commonLocator.normalizedUrl]: expectedContentInfo,
        })

        await setup.backgroundModules.bookmarks.addBookmark({
            url: identifier.normalizedUrl,
            fullUrl: identifier.fullUrl,
            tabId,
        })

        expect(
            await setup.backgroundModules.pages.options.pageIndexingSettingsStore.get(
                'pageContentInfo',
            ),
        ).toEqual({
            [normalizeUrl(url)]: expectedContentInfo,
            [commonLocator.normalizedUrl]: expectedContentInfo,
        })

        expect(
            await setup.storageManager
                .collection('locators')
                .findObjects({}, { order: [['fingerprint', 'desc']] }),
        ).toEqual(
            expect.arrayContaining([
                {
                    id: expect.anything(),
                    fingerprint: fingerprints[0].fingerprint,
                    ...commonLocator,
                },
                {
                    id: expect.anything(),
                    fingerprint: fingerprints[1].fingerprint,
                    ...commonLocator,
                },
            ]),
        )

        expect(
            await setup.storageManager.collection('pages').findObjects({}),
        ).toEqual([
            expect.objectContaining({
                url: identifier.normalizedUrl,
                fullUrl: identifier.fullUrl,
                hostname: urlParts.hostname,
                domain: urlParts.domain,
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
