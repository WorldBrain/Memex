import type { PipelineRes } from 'src/search'
import * as Raven from 'src/util/raven'
import type { PageIndexingBackground } from './background'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'
import { isTempPdfAccessUrl } from '@worldbrain/memex-common/lib/page-indexing/utils'

export function pageIsStub(page: Pick<PipelineRes, 'text' | 'terms'>): boolean {
    return (
        (page.text == null || !page.text.length) &&
        (page.terms == null || !page.terms.length)
    )
}

export const isUrlSupported = (params: {
    fullUrl: string
    allowFileUrls?: boolean
}) => {
    const unsupportedUrlPrefixes = [
        'blob:',
        'about:',
        'chrome://',
        'moz-extension://',
        'chrome-extension://',
        'chrome://extensions/',
    ]
    const fullUrl = getUnderlyingResourceUrl(params.fullUrl)

    // Ignore file URLs, though check `params.url` as the processed `fullUrl` may be a valid file URL (local PDF opened in PDF reader)
    if (params.fullUrl.startsWith('file://') && !params.allowFileUrls) {
        return false
    }

    // Ignore PDFs that are just urls and not the reader
    if (params.fullUrl.includes('.pdf')) {
        if (!params.fullUrl.includes('pdfjs/viewer.html?file')) {
            return false
        }
        if (params.fullUrl.includes('pdfjs/viewer.html?file')) {
            return true
        }
    }

    // Ignore our upload PDF access URLs
    if (isTempPdfAccessUrl(params.fullUrl)) {
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
        pageTitle?: string
    },
) {
    const indexed: { fullUrl: string }[] = []

    const tabIdsByUrls = await Promise.all(
        tabs
            .filter((tab) => isUrlSupported({ fullUrl: tab.url }))
            .map(async (tab) => {
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
                    metaData: { pageTitle: options.pageTitle ?? null },
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
