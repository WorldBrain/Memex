import TabManagementBackground from '.'
import { Tabs } from 'webextension-polyfill-ts'
import { RawPageContent } from 'src/page-analysis/types'

export interface FakeTab {
    id: number
    url: string
    favIcon?: string
}

export function injectFakeTabs(params: {
    tabManagement: TabManagementBackground
    tabsAPI: Tabs.Static
    tabs: Array<FakeTab>
}) {
    params.tabManagement.getOpenTabsInCurrentWindow = async () => params.tabs
    params.tabManagement.extractRawPageContent = async (tabId) => {
        return {
            type: 'html',
            url: params.tabs[tabId - 1].url,
            body: `Body ${tabId}`,
            lang: 'en',
            metadata: {},
        }
    }
    // For favIcon extraction
    params.tabsAPI.get = async () => null
}
