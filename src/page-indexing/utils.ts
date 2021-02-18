import { PipelineRes, SearchIndex } from 'src/search'
import PageStorage from './background/storage'
import * as Raven from 'src/util/raven'
import { PageIndexingBackground } from './background'
import { getUrl } from 'src/util/uri-utils'

export function pageIsStub(page: PipelineRes): boolean {
    return (
        (page.text == null || !page.text.length) &&
        (page.terms == null || !page.terms.length)
    )
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
