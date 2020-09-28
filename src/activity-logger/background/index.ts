import { Tabs, Browser } from 'webextension-polyfill-ts'

import { makeRemotelyCallableType } from 'src/util/webextensionRPC'
import initPauser, { getState as getPauseState } from './pause-logging'
import { TabManager } from '../../tab-management/background/tab-manager'
import { ActivityLoggerInterface } from './types'
import TabChangeListeners from './tab-change-listeners'
import PageVisitLogger from './log-page-visit'
import { SearchIndex } from 'src/search'
import { resolvablePromise } from 'src/util/resolvable'
import PageStorage from 'src/page-indexing/background/storage'
import BookmarksBackground from 'src/bookmarks/background'

export default class ActivityLoggerBackground {
    static SCROLL_UPDATE_FN = 'updateScrollState'

    tabManager: TabManager
    remoteFunctions: ActivityLoggerInterface

    private toggleLoggingPause = initPauser()

    constructor(options: {
        bookmarksBG: BookmarksBackground
        tabManager: TabManager
        searchIndex: SearchIndex
        pageStorage: PageStorage
        browserAPIs: Pick<
            Browser,
            'tabs' | 'runtime' | 'webNavigation' | 'storage'
        >
    }) {
        this.tabManager = options.tabManager
        this.remoteFunctions = {
            isLoggingPaused: this.isLoggingPaused.bind(this),
            toggleLoggingPause: this.toggleLoggingPause,
        }
    }

    static isTabLoaded = (tab: Tabs.Tab) => tab.status === 'complete'

    setupRemoteFunctions() {
        makeRemotelyCallableType<ActivityLoggerInterface>(this.remoteFunctions)
    }

    private async isLoggingPaused(): Promise<boolean> {
        const result = await getPauseState()

        return result !== false
    }
}

export { TabManager }
