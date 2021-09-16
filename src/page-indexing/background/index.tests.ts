import {
    FingerprintSchemeType,
    ContentLocatorType,
    ContentLocatorFormat,
    ContentFingerprint,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import { injectFakeTabs } from '../../tab-management/background/index.tests'
import { ContentLocator } from '@worldbrain/memex-common/lib/page-indexing/types'
import { BackgroundIntegrationTestSetup } from 'src/tests/integration-tests'

export async function indexTestFingerprintedPdf(
    setup: BackgroundIntegrationTestSetup,
    options?: {
        expectedServerId?: number | string
    },
) {
    const fullUrl = 'file:////home/bla/test.pdf'
    const contentSize = 456
    const fingerprints: ContentFingerprint[] = [
        {
            fingerprintScheme: FingerprintSchemeType.PdfV1,
            fingerprint: 'goldfinger',
        },
        {
            fingerprintScheme: FingerprintSchemeType.PdfV1,
            fingerprint: 'billfingers',
        },
    ]
    const locator: Pick<
        ContentLocator,
        'contentSize' | 'format' | 'originalLocation'
    > = {
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
    const expectedServerId = options?.expectedServerId ?? 1337
    expect(identifier).toEqual({
        normalizedUrl: `memex.cloud/ct/${expectedServerId}.pdf`,
        fullUrl: `https://memex.cloud/ct/${expectedServerId}.pdf`,
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

    return { identifier, fingerprints, contentSize }
}
