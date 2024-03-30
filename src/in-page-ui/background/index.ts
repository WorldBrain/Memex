import type { Tabs, ContextMenus, Browser } from 'webextension-polyfill'
import { bindMethod } from 'src/util/functions'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIInterface } from './types'
import { InPageUIContentScriptRemoteInterface } from '../content_script/types'
// import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { OVERVIEW_URL } from 'src/constants'
import browser from 'webextension-polyfill'
import { checkStripePlan } from 'src/util/subscriptions/storage'

export const CONTEXT_MENU_ID_PREFIX = '@memexContextMenu:'
export const CONTEXT_MENU_HIGHLIGHT_ID =
    CONTEXT_MENU_ID_PREFIX + 'createHighlight'
export const CONTEXT_MENU_SAVE_IMAGE_ID = CONTEXT_MENU_ID_PREFIX + 'saveImage'

export interface Props {
    tabsAPI: Tabs.Static
    contextMenuAPI: ContextMenus.Static
    browserAPIs: Browser
}

export class InPageUIBackground {
    remoteFunctions: InPageUIInterface<'provider'>

    constructor(private options: Props) {
        this.remoteFunctions = {
            showSidebar: bindMethod(this, 'showSidebar'),
            openDashboard: bindMethod(this, 'openDashboard'),
            getCurrentTabURL: bindMethod(this, 'getCurrentTabURL'),
            checkStripePlan: bindMethod(this, 'checkStripePlan'),
            updateContextMenuEntries: bindMethod(
                this,
                'updateContextMenuEntries',
            ),
        }

        this.setupContextMenuEntries()
        this.setupTabsAPIMessages()
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
    }

    setupTabsAPIMessages() {
        browser.runtime.onMessage.addListener(
            // @ts-ignore: Temporarily ignore type error until type definitions are updated or corrected.
            (message, sender, sendResponse) => {
                if (message.action === 'queryTabs') {
                    browser.tabs
                        .query({ active: true, currentWindow: true })
                        .then((tabs) => {
                            console.log('tabs11: ', tabs),
                                sendResponse({ tabs: tabs })
                        })

                    return true // Indicates you wish to send a response asynchronously
                }
            },
        )
    }

    private async getHighlightContextMenuTitle(): Promise<string> {
        // TODO mv3: figure out why BG Service Worker crashes when this fn's invoked (or find another way to get same shortcut data)
        // const {
        //     shortcutsEnabled,
        //     createHighlight,
        // } = await getKeyboardShortcutsState()
        const baseTitle = 'Highlight with Memex'
        return baseTitle

        // if (!createHighlight.shortcut.length) {
        //     return baseTitle
        // } else if (!shortcutsEnabled || !createHighlight.enabled) {
        //     return `${baseTitle} -- ${createHighlight.shortcut} (disabled)`
        // }

        // return `${baseTitle} (${createHighlight.shortcut})`
    }

    setupContextMenuEntries() {
        this.options.contextMenuAPI.create({
            id: CONTEXT_MENU_HIGHLIGHT_ID,
            title: 'Highlight with Memex',
            contexts: ['selection'],
        })

        this.options.contextMenuAPI.onClicked.addListener(
            ({ menuItemId }, tab) => {
                if (menuItemId === CONTEXT_MENU_HIGHLIGHT_ID) {
                    return this.createHighlightInTab(tab.id)
                }
            },
        )
        this.options.contextMenuAPI.create({
            id: CONTEXT_MENU_SAVE_IMAGE_ID,
            title: 'Save with Memex',
            contexts: ['image'],
        })

        this.options.contextMenuAPI.onClicked.addListener(
            async ({ menuItemId, srcUrl }, tab) => {
                if (menuItemId === CONTEXT_MENU_SAVE_IMAGE_ID && tab.id) {
                    // Send a message to the content script to get the image data
                    const imageData = await this.options.tabsAPI.sendMessage(
                        tab.id,
                        {
                            action: 'getImageData',
                            srcUrl: srcUrl,
                        },
                    )
                    if (imageData) {
                        this.saveImageAsNewNote(tab.id, imageData)
                    }
                }
            },
        )
    }

    async updateContextMenuEntries() {
        await this.options.contextMenuAPI.update(CONTEXT_MENU_HIGHLIGHT_ID, {
            title: await this.getHighlightContextMenuTitle(),
        })
    }

    async openDashboard() {
        await this.options.tabsAPI.create({ url: OVERVIEW_URL })
    }
    async checkStripePlan(email: string) {
        await checkStripePlan(email)
    }
    async getCurrentTabURL() {
        const tabs = await this.options.tabsAPI.query({
            active: true,
            currentWindow: true,
        })
        if (tabs.length > 0) {
            return tabs[0].url // This returns the URL of the current active tab
        }
        return null // Return null or an appropriate value if no active tab is found
    }

    async showSidebar() {
        const currentTab = (
            await this.options.tabsAPI.query({
                active: true,
                currentWindow: true,
            })
        )[0]
        runInTab<InPageUIContentScriptRemoteInterface>(
            currentTab.id,
        ).showSidebar()
    }

    private createHighlightInTab = (tabId: number) =>
        runInTab<InPageUIContentScriptRemoteInterface>(tabId).createHighlight(
            false,
            null,
        )
    private saveImageAsNewNote = (tabId: number, imageData: string) =>
        runInTab<InPageUIContentScriptRemoteInterface>(
            tabId,
        ).saveImageAsNewNote(imageData)
}
