import { PipelineRes, SearchIndex } from 'src/search'
import PageStorage from './background/storage'

export function pageIsStub(page: PipelineRes): boolean {
    return page.text == null && (page.terms == null || !page.terms.length)
}

export async function maybeIndexTabs(
    tabs: Array<{ url: string; tabId: number }>,
    options: {
        pageStorage: PageStorage
        createPage: SearchIndex['createPageViaBmTagActs']
        time: number
    },
) {
    const indexed: { fullUrl: string }[] = []
    await Promise.all(
        tabs.map(async tab => {
            const page = await options.pageStorage.getPage(tab.url)

            let error = false
            if (!page || pageIsStub(page)) {
                try {
                    await options.createPage({
                        tabId: tab.tabId,
                        url: tab.url,
                        allowScreenshot: false,
                        visitTime: options.time,
                        save: true,
                    })
                } catch (e) {
                    error = true
                    console.error(e)
                }
            } else {
                // Add new visit if none, else page won't appear in results
                await options.pageStorage.addPageVisitIfHasNone(
                    tab.url,
                    options.time,
                )
            }
            if (!error) {
                indexed.push({ fullUrl: tab.url })
            }
        }),
    )

    return indexed
}
