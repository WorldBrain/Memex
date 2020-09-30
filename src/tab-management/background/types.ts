import { WebNavigation, Tabs } from 'webextension-polyfill-ts'
import {
    RemoteFunctionRole,
    RemoteFunctionWithExtraArgs,
    RemoteFunctionWithoutExtraArgs,
} from 'src/util/webextensionRPC'
import Tab from './tab-state'

export interface TabManagementInterface<Role extends RemoteFunctionRole> {
    fetchTab: RemoteFunctionWithoutExtraArgs<Role, number, Tab>
    fetchTabByUrl: RemoteFunctionWithoutExtraArgs<Role, string, Tab>
    setTabAsIndexable: RemoteFunctionWithExtraArgs<Role, void>
}

export type NavState = Partial<WebNavigation.OnCommittedDetailsType> & {
    type?: WebNavigation.TransitionType
    qualifiers?: WebNavigation.TransitionQualifier
}

export interface ScrollState {
    pixel: number
    maxPixel: number
    percent: number
    maxPercent: number
}

/**
 * Represents a tab as it related to the internal operations of the ext; some similarity
 * with the browser Tabs API's tab state.
 */
export interface TabState {
    id?: number
    url: string
    isActive: boolean
    isLoaded: boolean
    visitTime: number
    activeTime: number
    lastActivated: number
    scrollState: ScrollState
    navState: NavState
    windowId: number
}

export type TabChangeListener = (
    tabId: number,
    changeInfo: Tabs.OnUpdatedChangeInfoType,
    tab: Tabs.Tab,
) => Promise<void>
