import { PipelineRes, SearchIndex } from 'src/search'
import PageStorage from './background/storage'
import * as Raven from 'src/util/raven'
import { PageIndexingBackground } from './background'

export function pageIsStub(page: PipelineRes): boolean {
    return (
        (page.text == null || !page.text.length) &&
        (page.terms == null || !page.terms.length)
    )
}

export async function maybeIndexTabs(
    tabs: Array<{ url: string; tabId: number }>,
    options: {
        pageStorage: PageStorage
        createPage: PageIndexingBackground['createPageViaBmTagActs']
        time: number
    },
) {
    const indexed: { fullUrl: string }[] = []
    await Promise.all(
        tabs.map(async (tab) => {
            const page = await options.pageStorage.getPage(tab.url)

            let error = false
            const handleErrors = (err) => {
                Raven.captureException(err)
                error = true
                console.error(err)
            }

            if (!page || pageIsStub(page)) {
                await options
                    .createPage({
                        tabId: tab.tabId,
                        fullUrl: tab.url,
                        allowScreenshot: false,
                        visitTime: options.time,
                        stubOnly: true,
                        save: true,
                    })
                    .catch(handleErrors)
            } else {
                // Add new visit if none, else page won't appear in results
                await options.pageStorage
                    .addPageVisitIfHasNone(tab.url, options.time)
                    .catch(handleErrors)
            }
            if (!error) {
                indexed.push({ fullUrl: tab.url })
            }
        }),
    )

    return indexed
}
