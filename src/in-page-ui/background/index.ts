import { Tabs, ContextMenus } from 'webextension-polyfill-ts'
import { bindMethod } from 'src/util/functions'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIInterface } from './types'
import { InPageUIContentScriptRemoteInterface } from '../content_script/types'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'

export const CONTEXT_MENU_ID_PREFIX = '@memexContextMenu:'
export const CONTEXT_MENU_HIGHLIGHT_ID =
    CONTEXT_MENU_ID_PREFIX + 'createHighlight'

export interface Props {
    queryTabs: Tabs.Static['query']
    contextMenuAPI: ContextMenus.Static
}

export class InPageUIBackground {
    remoteFunctions: InPageUIInterface<'provider'>

    constructor(private options: Props) {
        this.remoteFunctions = {
            showSidebar: bindMethod(this, 'showSidebar'),
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
        const {
            shortcutsEnabled,
            createHighlight,
        } = await getKeyboardShortcutsState()
        const baseTitle = 'Highlight with Memex'

        if (!createHighlight.shortcut.length) {
            return baseTitle
        } else if (!shortcutsEnabled || !createHighlight.enabled) {
            return `${baseTitle} (disabled: ${createHighlight.shortcut})`
        }

        return `${baseTitle} (${createHighlight.shortcut})`
    }

    async setupContextMenuEntries() {
        this.options.contextMenuAPI.create({
            id: CONTEXT_MENU_HIGHLIGHT_ID,
            title: await this.getHighlightContextMenuTitle(),
            contexts: ['selection'],
            onclick: (_, tab) => this.createHighlightInTab(tab.id),
        })
    }

    async updateContextMenuEntries() {
        await this.options.contextMenuAPI.update(CONTEXT_MENU_HIGHLIGHT_ID, {
            title: await this.getHighlightContextMenuTitle(),
        })
    }

    async showSidebar() {
        const currentTab = (
            await this.options.queryTabs({ active: true, currentWindow: true })
        )[0]
        runInTab<InPageUIContentScriptRemoteInterface>(
            currentTab.id,
        ).showSidebar()
    }

    private createHighlightInTab = (tabId: number) =>
        runInTab<InPageUIContentScriptRemoteInterface>(tabId).createHighlight({
            clickToEdit: true,
        })

    private createAnnotationInTab = (tabId: number) =>
        runInTab<InPageUIContentScriptRemoteInterface>(tabId).createAnnotation()
}
