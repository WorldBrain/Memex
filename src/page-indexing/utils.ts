import type { PipelineRes } from 'src/search'
import * as Raven from 'src/util/raven'
import type { PageIndexingBackground } from './background'
import { getUrl } from 'src/util/uri-utils'

export function pageIsStub(page: Pick<PipelineRes, 'text' | 'terms'>): boolean {
    return (
        (page.text == null || !page.text.length) &&
        (page.terms == null || !page.terms.length)
    )
}

export const isUrlSupported = (params: { url: string }) => {
    const unsupportedUrlPrefixes = [
        'about:',
        'chrome://',
        'moz-extension://',
        'chrome-extension://',
    ]
    const fullUrl = getUrl(params.url)
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
        time: number | '$now'
    },
) {
    const indexed: { fullUrl: string }[] = []
    await Promise.all(
        tabs.filter(isUrlSupported).map(async (tab) => {
            let error = false
            const fullUrl = getUrl(tab.url)
            await options
                .createPage(
                    {
                        fullUrl,
                        tabId: tab.id,
                        allowScreenshot: false,
                        visitTime: options.time,
                    },
                    { addInboxEntryOnCreate: true },
                )
                .catch((err) => {
                    Raven.captureException(err)
                    error = true
                    console.error(err)
                })

            if (!error) {
                indexed.push({ fullUrl })
            }
        }),
    )

    return indexed
}
