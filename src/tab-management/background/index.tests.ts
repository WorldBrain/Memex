import TabManagementBackground from '.'
import { Tabs } from 'webextension-polyfill'

export type FakeTab = FakeHtmlTab | FakePdfTab
export interface FakeHtmlTab {
    type?: 'html'
    id?: number
    url: string
    favIcon?: string
    htmlBody?: string
    title?: string
}
export interface FakePdfTab {
    type: 'pdf'
    id?: number
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
    for (const [index, fakeTab] of params.tabs.entries()) {
        fakeTab.id = fakeTab.id ?? index + 1
    }
    params.tabManagement.getOpenTabsInCurrentWindow = async () =>
        params.tabs.map((fakeTab) => ({
            id: fakeTab.id,
            url: fakeTab.url,
        }))
    params.tabManagement.extractRawPageContent = async (tabId) => {
        const fakeTab = params.tabs.find((tab) => tab.id === tabId)
        if (fakeTab.type === 'pdf') {
            return {
                type: 'pdf',
                url: fakeTab.url,
            }
        }
        return {
            type: 'html',
            url: fakeTab.url,
            body: !params.excludeBody
                ? fakeTab.htmlBody ?? `Body ${tabId}`
                : undefined,
            lang: 'en',
            metadata: params.includeTitle
                ? ({
                      title: fakeTab.title ?? `Title ${tabId}`,
                  } as any)
                : {},
        }
    }
    params.tabManagement.findTabIdByFullUrl = async (fullUrl) =>
        params.tabs.find((tab) => tab.url === fullUrl)?.id
    // For favIcon extraction
    params.tabManagement.getFavIcon = async ({ tabId }) => {
        const fakeTab = params.tabs.find((tab) => tab.id === tabId)
        return fakeTab.favIcon ?? null
    }
    params.tabsAPI.get = () => null
}
