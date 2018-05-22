import { WebNavigation, Tabs } from 'webextension-polyfill-ts'

export type NavState = Partial<WebNavigation.OnCommittedDetailsType>

export interface ScrollState {
    pixel: number
    maxPixel: number
    percent: number
    maxPercent: number
}

/**
 * Tab state contains user interaction data for the current ongoing visit in this tab. It can also
 * handle scheduling a future logging event. TODO: do we need to pass this down here?
 */
export interface TabState {
    url: string
    isActive: boolean
    visitTime: number
    activeTime: number
    lastActivated: number
    scrollState: ScrollState
    navState: NavState
}

export type TabChangeListener = (
    tabId: number,
    changeInfo: Tabs.OnUpdatedChangeInfoType,
    tab: Tabs.Tab,
) => Promise<void>
