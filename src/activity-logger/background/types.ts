import { WebNavigation, Tabs } from 'webextension-polyfill-ts'
import { SearchIndex } from 'src/search'
import Tab from './tab-state'

export interface ActivityLoggerInterface {
    toggleLoggingPause(minutes?: number): void
    fetchTab(id: number): Tab
    fetchTabByUrl(url: string): Tab
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
    isBookmarked: boolean
    isLoggable: boolean
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

export type TabIndexer = (tab: Tabs.Tab) => Promise<void>

export type LoggableTabChecker = (tab: Tabs.Tab) => Promise<boolean>
export type VisitInteractionUpdater = (
    interalTab: TabState,
    searchIndex: SearchIndex,
) => Promise<void>
export type FavIconFetcher = (url: string) => Promise<string>
export type FavIconChecker = (url: string) => Promise<boolean>
export type FavIconCreator = (url: string, data: string) => Promise<void>
export type BookmarkChecker = (url: string) => Promise<boolean>
export type PageCreator = (url: string, data: string) => Promise<void>
export type PageTermsAdder = (url: string, data: string) => Promise<void>
