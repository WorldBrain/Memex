import { createPageViaBmTagActs } from './on-demand-indexing'
import { getPage } from './util'

interface Props {
    url: string
    tag: string
    tabId?: number
}

const modifyTag = (shouldAdd: boolean) =>
    async function({ url, tag, tabId }: Props) {
        let page = await getPage(url)

        if (page == null || page.isStub) {
            page = await createPageViaBmTagActs({ url, tabId })
        }

        // Add new visit if none, else page won't appear in results
        if (!page.visits.length) {
            page.addVisit()
        }

        if (shouldAdd) {
            page.addTag(tag)
        } else {
            page.delTag(tag)
        }

        await page.save()
    }

export const delTag = modifyTag(false)
export const addTag = modifyTag(true)
