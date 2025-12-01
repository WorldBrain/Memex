import { getUnderlyingResourceUrl } from 'src/util/uri-utils'

export const getCurrentTab = async (browserAPIs: {
    tabsAPI: typeof chrome.tabs
    runtimeAPI: typeof chrome.runtime
}): Promise<chrome.tabs.Tab & { originalUrl: string }> => {
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
