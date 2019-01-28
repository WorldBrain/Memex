import { createPageViaBmTagActs } from './on-demand-indexing'
import { getPage } from './util'
import { initErrHandler } from './storage'
import { Dexie } from './types'
import { remoteFunction } from 'src/util/webextensionRPC'
import browser from 'webextension-polyfill'

interface Props {
    url: string
    tag: string
    tabId?: number
}

const modifyTag = (shouldAdd: boolean) => (getDb: () => Promise<Dexie>) =>
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

export const fetchPageTags = (getDb: () => Promise<Dexie>) => async (
    url: string,
) => {
    const page = await getPage(getDb)(url)

    return page != null ? page.tags : []
}

const getAllInWindow = windowId => browser.tabs.query({ windowId })
const getAllTabsInCurrentWindow = async () => {
    const currentWindow = await browser.windows.getCurrent()
    return getAllInWindow(currentWindow.id)
}
const addTagRPC = remoteFunction('addTag')
const delTagRPC = remoteFunction('delTag')
const fetchPageTagsRPC = remoteFunction('fetchPageTags')

export const addTagsToOpenTabs = async (tag: string): Promise<void> => {
    const tabs = await getAllTabsInCurrentWindow()
    for (const tab of tabs) {
        const tags = await fetchPageTagsRPC(tab.url)
        if (!tags.includes(tag)) {
            addTagRPC({
                url: tab.url,
                tag,
            })
        }
    }
}
export const delTagsFromOpenTabs = async (tag: string): Promise<void> => {
    const tabs = await getAllTabsInCurrentWindow()
    for (const tab of tabs) {
        const tags = await fetchPageTagsRPC(tab.url)
        if (tags.includes(tag)) {
            delTagRPC({
                url: tab.url,
                tag,
            })
        }
    }
}
