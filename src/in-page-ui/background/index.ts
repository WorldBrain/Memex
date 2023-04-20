import type { Tabs, ContextMenus } from 'webextension-polyfill'
import { bindMethod } from 'src/util/functions'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIInterface } from './types'
import { InPageUIContentScriptRemoteInterface } from '../content_script/types'
// import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { OVERVIEW_URL } from 'src/constants'

export const CONTEXT_MENU_ID_PREFIX = '@memexContextMenu:'
export const CONTEXT_MENU_HIGHLIGHT_ID =
    CONTEXT_MENU_ID_PREFIX + 'createHighlight'

export interface Props {
    tabsAPI: Tabs.Static
    contextMenuAPI: ContextMenus.Static
}

export class InPageUIBackground {
    remoteFunctions: InPageUIInterface<'provider'>

    constructor(private options: Props) {
        this.remoteFunctions = {
            showSidebar: bindMethod(this, 'showSidebar'),
            openDashboard: bindMethod(this, 'openDashboard'),
            updateContextMenuEntries: bindMethod(
                this,
                'updateContextMenuEntries',
            ),
        }

        this.setupContextMenuEntries()
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
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
    }

    async updateContextMenuEntries() {
        await this.options.contextMenuAPI.update(CONTEXT_MENU_HIGHLIGHT_ID, {
            title: await this.getHighlightContextMenuTitle(),
        })
    }

    async openDashboard() {
        await this.options.tabsAPI.create({ url: OVERVIEW_URL })
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
        )
}
