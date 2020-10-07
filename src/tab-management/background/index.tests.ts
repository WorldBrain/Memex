import TabManagementBackground from '.'
import { Tabs } from 'webextension-polyfill-ts'

export interface FakeTab {
    id: number
    url: string
    favIcon?: string
}

export function injectFakeTabs(params: {
    tabManagement: TabManagementBackground
    tabsAPI: Tabs.Static
    tabs: Array<FakeTab>
    excludeBody?: boolean
    includeTitle?: boolean
}) {
    params.tabManagement.getOpenTabsInCurrentWindow = async () => params.tabs
    params.tabManagement.extractRawPageContent = async (tabId) => {
        return {
            type: 'html',
            url: params.tabs[tabId - 1].url,
            body: !params.excludeBody ? `Body ${tabId}` : undefined,
            lang: 'en',
            metadata: params.includeTitle
                ? {
                      title: `Title ${tabId}`,
                  }
                : {},
        }
    }
    // For favIcon extraction
    params.tabsAPI.get = async () => null
}
