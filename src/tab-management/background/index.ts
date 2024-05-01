import type { Tabs, Browser } from 'webextension-polyfill'
import { EventEmitter } from 'events'
import type TypedEventEmitter from 'typed-emitter'

import { mapChunks } from 'src/util/chunk'
import { CONCURR_TAB_LOAD } from '../constants'
import { registerRemoteFunctions, runInTab } from 'src/util/webextensionRPC'
import type { TabManagementInterface } from './types'
import { fetchFavIcon } from 'src/page-analysis/background/get-fav-icon'
import { isLoggable } from 'src/activity-logger'
import { captureException } from 'src/util/raven'
import type { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { isBrowserPageTab, isExtensionTab } from '../utils'
import type { RawPageContent } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/types'
import { isUrlSupported } from 'src/page-indexing/utils'

const SCROLL_UPDATE_FN = 'updateScrollState'
const CONTENT_SCRIPTS = ['/lib/browser-polyfill.js', '/content_script.js']

export interface TabManagementEvents {
    tabRemoved(event: { tabId: number }): void
}

export default class TabManagementBackground {
    events = new EventEmitter() as TypedEventEmitter<TabManagementEvents>
    remoteFunctions: TabManagementInterface<'provider'>
    // _indexableTabs: { [tabId: number]: true } = {}

    // /**
    //  * Used to stop of tab updated event listeners while the
    //  * tracking of existing tabs is happening.
    //  */
    // private trackingExistingTabs = resolvablePromise()

    constructor(
        private options: {
            manifestVersion: '2' | '3'
            browserAPIs: Pick<
                Browser,
                | 'tabs'
                | 'runtime'
                | 'webNavigation'
                | 'storage'
                | 'windows'
                | 'scripting'
            >
        },
    ) {
        this.remoteFunctions = {
            // fetchTabByUrl: remoteFunctionWithoutExtraArgs(async (url) =>
            //     this.tabManager.getTabStateByUrl(url),
            // ),
            // setTabAsIndexable: remoteFunctionWithExtraArgs(
            //     this.setTabAsIndexable,
            // ),
        }

        options.browserAPIs.tabs.onRemoved.addListener((tabId) =>
            this.events.emit('tabRemoved', { tabId }),
        )
    }

    static isTabLoaded = (tab: Tabs.Tab) => tab.status === 'complete'

    setupRemoteFunctions() {
        registerRemoteFunctions(this.remoteFunctions)
    }

    // setTabAsIndexable: TabManagementInterface<
    //     'provider'
    // >['setTabAsIndexable']['function'] = async ({ tab }) => {
    //     this._indexableTabs[tab.id] = true
    // }

    async extractRawPageContent(tabId: number): Promise<RawPageContent> {
        // This is a hack around a problem that we were experiencing where the CS doesn't fully get
        //  to the point where its RPCs are ready to be called from the BG script here - or at least this one.
        //  Thus when it got called it would error out. We realized that reinjecting the CS would partially solve it,
        //  so that's what we're doing.
        //  TODO: Solve the core issue - likely something in the RPC wrapper logic
        let content: RawPageContent
        try {
            content = await runInTab<InPageUIContentScriptRemoteInterface>(
                tabId,
            ).extractRawPageContent()
        } catch (err) {
            const tab = await this.options.browserAPIs.tabs.get(tabId)
            await this.injectContentScripts(tab)
            content = await runInTab<InPageUIContentScriptRemoteInterface>(
                tabId,
            ).extractRawPageContent()
        }
        return content
    }

    async getOpenTabsInCurrentWindow(): Promise<
        Array<{ id: number; url: string }>
    > {
        const windowId = this.options.browserAPIs.windows.WINDOW_ID_CURRENT
        return (await this.options.browserAPIs.tabs.query({ windowId }))
            .map((tab) => ({ id: tab.id!, url: tab.url }))
            .filter(
                (tab) =>
                    tab.id &&
                    tab.url &&
                    tab.id !== this.options.browserAPIs.tabs.TAB_ID_NONE,
            )
    }

    async getFavIcon({ tabId }: { tabId: number }) {
        const tab = await this.options.browserAPIs.tabs.get(tabId)

        if (tab?.favIconUrl == null) {
            return undefined
        }

        return fetchFavIcon(tab.favIconUrl)
    }

    async findTabIdByFullUrl(fullUrl: string) {
        const tabs = await this.options.browserAPIs.tabs.query({ url: fullUrl })
        return tabs.length ? tabs[0].id : null
    }

    async mapTabChunks<T>(
        mapFn: (tab: Tabs.Tab) => Promise<T>,
        {
            chunkSize = CONCURR_TAB_LOAD,
            query = {},
            onError,
        }: {
            chunkSize?: number
            query?: Tabs.QueryQueryInfoType
            onError?: (error: Error, tab: Tabs.Tab) => void
        } = {},
    ) {
        const tabs = await this.options.browserAPIs.tabs.query(query)
        await mapChunks(tabs, chunkSize, mapFn, onError)
    }

    canTabRunContentScripts(tab?: Tabs.Tab): boolean {
        const url = tab?.url

        return !(
            url == null ||
            !isUrlSupported({ fullUrl: url }) ||
            isExtensionTab({ url }) ||
            isBrowserPageTab({ url }) ||
            !isLoggable({ url })
        )
    }

    async injectContentScriptsIfNeeded(tabId: number) {
        const tab = await this.options.browserAPIs.tabs.get(tabId)
        if (!this.canTabRunContentScripts(tab)) {
            return
        }

        try {
            await runInTab<InPageUIContentScriptRemoteInterface>(tabId, {
                quietConsole: true,
            }).confirmTabScriptLoaded()
        } catch (err) {
            // If the ping fails, the content script is not yet set up
            await this.injectContentScripts(tab)
        }
    }

    async injectContentScripts(tab: Tabs.Tab) {
        if (!this.canTabRunContentScripts(tab)) {
            return
        }

        if (this.options.manifestVersion === '3') {
            await this.options.browserAPIs.scripting
                .executeScript({
                    target: { tabId: tab.id },
                    files: CONTENT_SCRIPTS,
                })
                .catch(this.handleContentScriptInjectionError(tab))
        } else {
            for (const file of CONTENT_SCRIPTS) {
                await this.options.browserAPIs.tabs
                    .executeScript(tab.id, { file, runAt: 'document_idle' })
                    .catch(this.handleContentScriptInjectionError(tab))
            }
        }
    }

    private handleContentScriptInjectionError = (tab: Tabs.Tab) => (
        err: Error,
    ) => {
        const message = `Cannot inject content-scripts into page "${tab.url}" - reason: ${err.message}`
        captureException(new Error(message))
        console.error(message)
    }
}
