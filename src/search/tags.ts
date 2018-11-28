import { createPageViaBmTagActs } from './on-demand-indexing'
import { getPage } from './util'
import { initErrHandler } from './storage'
import { Dexie } from './types'

interface Props {
    url: string
    tag: string
    tabId?: number
}

const modifyTag = (shouldAdd: boolean) => (getDb: Promise<Dexie>) =>
    async function({ url, tag, tabId }: Props) {
        let page = await getPage(getDb)(url)

        if (page == null || page.isStub) {
            page = await createPageViaBmTagActs(getDb)({ url, tabId })
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

        await page.save(getDb).catch(initErrHandler())
    }

export const delTag = modifyTag(false)
export const addTag = modifyTag(true)

export const fetchPageTags = (getDb: Promise<Dexie>) => async (url: string) => {
    const page = await getPage(getDb)(url)

    return page != null ? page.tags : []
}
