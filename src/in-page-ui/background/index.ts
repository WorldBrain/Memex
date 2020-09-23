import { Tabs, ContextMenus } from 'webextension-polyfill-ts'
import { bindMethod } from 'src/util/functions'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIInterface } from './types'
import { InPageUIContentScriptRemoteInterface } from '../content_script/types'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'

export const CONTEXT_MENU_ID_PREFIX = '@memexContextMenu:'

export interface Props {
    queryTabs: Tabs.Static['query']
    createContextMenuEntry: ContextMenus.Static['create']
}

export class InPageUIBackground implements InPageUIInterface<'provider'> {
    remoteFunctions: InPageUIInterface<'provider'>

    constructor(private options: Props) {
        this.remoteFunctions = {
            showSidebar: bindMethod(this, 'showSidebar'),
        }

        this.setupContextMenuEntries()
    }

    async setupContextMenuEntries() {
        const shortcutState = await getKeyboardShortcutsState()

        const shortcutStr =
            shortcutState.shortcutsEnabled &&
            shortcutState.createHighlight.enabled
                ? shortcutState.createHighlight.shortcut
                : ''

        this.options.createContextMenuEntry({
            id: CONTEXT_MENU_ID_PREFIX + 'createHighlight',
            title: `Highlight with Memex`,
            contexts: ['selection'],
            onclick: (_, tab) => this.createHighlightInTab(tab.id),
        })
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions)
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
