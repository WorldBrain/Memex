import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { AnnotationsCacheInterface } from 'src/annotations/annotations-cache'
import { SidebarTheme } from '../types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { Analytics } from 'src/analytics'
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'
import { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'

export interface SidebarContainerDependencies {
    elements?: {
        topBarLeft?: JSX.Element
    }
    pageUrl?: string
    getPageUrl: () => string
    pageTitle?: string
    searchResultLimit?: number
    showGoToAnnotationBtn?: boolean
    initialState?: 'visible' | 'hidden'
    onClickOutside?: React.MouseEventHandler
    annotationsCache: AnnotationsCacheInterface
    showAnnotationShareModal?: () => void
    showBetaFeatureNotifModal?: () => void

    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
    customLists: RemoteCollectionsInterface
    contentSharing: ContentSharingInterface
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    theme?: Partial<SidebarTheme>
    // search: SearchInterface
    // bookmarks: BookmarksInterface
    analytics: Analytics
    copyToClipboard: (text: string) => Promise<boolean>
    copyPaster: RemoteCopyPasterInterface
    contentScriptBackground: ContentScriptsInterface<'caller'>
}

export type SearchType = 'notes' | 'page' | 'social'
export type PageType = 'page' | 'all'
export interface SearchTypeChange {
    searchType?: 'notes' | 'page' | 'social'
    resultsSearchType?: 'notes' | 'page' | 'social'
    pageType?: 'page' | 'all'
}
