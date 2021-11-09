import type { PipelineRes } from 'src/search'
import * as Raven from 'src/util/raven'
import type { PageIndexingBackground } from './background'
import { getUrl } from 'src/util/uri-utils'
import type { ContentLocator } from '@worldbrain/memex-common/lib/page-indexing/types'
import { ContentLocatorType } from '@worldbrain/memex-common/lib/personal-cloud/storage/types'

export function pageIsStub(page: Pick<PipelineRes, 'text' | 'terms'>): boolean {
    return (
        (page.text == null || !page.text.length) &&
        (page.terms == null || !page.terms.length)
    )
}

export function pageIsPdf(page: Pick<PipelineRes, 'url'>): boolean {
    return page.url.startsWith('memex.cloud/ct/')
}

export function pickBestLocator(
    locators: ContentLocator[],
): ContentLocator | null {
    if (!locators.length) {
        return null
    }

    const sortedLocators = locators.sort(
        (a, b) => b.lastVisited ?? 0 - a.lastVisited ?? 0,
    )
    const remoteLocators: ContentLocator[] = []
    const localLocators: ContentLocator[] = []

    for (const locator of sortedLocators) {
        if (locator.locationType === ContentLocatorType.Remote) {
            remoteLocators.push(locator)
        } else if (locator.locationType === ContentLocatorType.Local) {
            localLocators.push(locator)
        }
    }

    if (remoteLocators.length) {
        return remoteLocators[0]
    }

    if (localLocators.length) {
        return localLocators[0]
    }

    return null
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
        tabs.map(async (tab) => {
            let error = false
            const handleErrors = (err) => {
                Raven.captureException(err)
                error = true
                console.error(err)
            }

            await options
                .createPage(
                    {
                        tabId: tab.id,
                        fullUrl: getUrl(tab.url),
                        allowScreenshot: false,
                        visitTime: options.time,
                    },
                    { addInboxEntryOnCreate: true },
                )
                .catch(handleErrors)

            if (!error) {
                indexed.push({ fullUrl: getUrl(tab.url) })
            }
        }),
    )

    return indexed
}
