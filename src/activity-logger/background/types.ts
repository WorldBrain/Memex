import { WebNavigation, Tabs } from 'webextension-polyfill-ts'
import { SearchIndex } from 'src/search'
import { TabState } from 'src/tab-management/background/types'

export interface ActivityLoggerInterface {
    toggleLoggingPause(minutes?: number): void
    isLoggingPaused(): Promise<boolean>
}

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
