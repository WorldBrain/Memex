import type { Runtime, Tabs } from 'webextension-polyfill'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'

export const getCurrentTab = async (browserAPIs: {
    tabsAPI: Pick<Tabs.Static, 'query'>
    runtimeAPI: Pick<Runtime.Static, 'getURL'>
}): Promise<Tabs.Tab & { originalUrl: string }> => {
    const [currentTab] = await browserAPIs.tabsAPI.query({
        active: true,
        currentWindow: true,
    })

    return {
        ...currentTab,
        originalUrl: currentTab.url,
        url: getUnderlyingResourceUrl(currentTab.url, browserAPIs),
    }
}
