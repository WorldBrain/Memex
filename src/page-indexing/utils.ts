import type { PipelineRes } from 'src/search'
import * as Raven from 'src/util/raven'
import type { PageIndexingBackground } from './background'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'

export function pageIsStub(page: Pick<PipelineRes, 'text' | 'terms'>): boolean {
    return (
        (page.text == null || !page.text.length) &&
        (page.terms == null || !page.terms.length)
    )
}

export const isUrlSupported = (params: {
    url: string
    allowFileUrls?: boolean
}) => {
    const unsupportedUrlPrefixes = [
        'about:',
        'chrome://',
        'moz-extension://',
        'chrome-extension://',
    ]
    const fullUrl = getUnderlyingResourceUrl(params.url)

    // Ignore file URLs, though check `params.url` as the processed `fullUrl` may be a valid file URL (local PDF opened in PDF reader)
    if (params.url.startsWith('file://') && !params.allowFileUrls) {
        return false
    }

    for (const prefix of unsupportedUrlPrefixes) {
        if (fullUrl.startsWith(prefix)) {
            return false
        }
    }
    return true
}

export async function maybeIndexTabs(
    tabs: Array<{ url: string; id: number }>,
    options: {
        createPage: PageIndexingBackground['indexPage']
        waitForContentIdentifier: PageIndexingBackground['waitForContentIdentifier']
        time: number | '$now'
    },
) {
    const indexed: { fullUrl: string }[] = []

    const tabIdsByUrls = await Promise.all(
        tabs.filter(isUrlSupported).map(async (tab) => {
            const { fullUrl } = await options.waitForContentIdentifier({
                tabId: tab.id,
                fullUrl: getUnderlyingResourceUrl(tab.url),
            })
            return [fullUrl, tab.id] as [string, number]
        }),
    )

    for (const [fullUrl, tabId] of tabIdsByUrls) {
        let error = false
        try {
            await options.createPage(
                {
                    tabId,
                    fullUrl,
                    allowScreenshot: false,
                    visitTime: options.time,
                },
                { addInboxEntryOnCreate: true },
            )
        } catch (err) {
            error = true
            Raven.captureException(err)
            console.error(err)
        }

        if (!error) {
            indexed.push({ fullUrl })
        }
    }

    return indexed
}
