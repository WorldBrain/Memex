import { WebNavigation, Tabs } from 'webextension-polyfill-ts'

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
}

export type TabChangeListener = (
    tabId: number,
    changeInfo: Tabs.OnUpdatedChangeInfoType,
    tab: Tabs.Tab,
) => Promise<void>

export type LoggableTabChecker = (tab: Tabs.Tab) => Promise<boolean>
export type VisitInteractionUpdater = (interalTab: TabState) => Promise<void>
export type FavIconFetcher = (url: string) => Promise<string>
export type FavIconChecker = (url: string) => Promise<boolean>
export type FavIconCreator = (url: string, data: string) => Promise<void>
export type PageCreator = (url: string, data: string) => Promise<void>
export type PageTermsAdder = (url: string, data: string) => Promise<void>
