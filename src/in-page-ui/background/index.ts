import { Tabs, ContextMenus } from 'webextension-polyfill-ts'
import { bindMethod } from 'src/util/functions'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIInterface } from './types'
import { InPageUIContentScriptRemoteInterface } from '../content_script/types'
import { CREATE_ANNOTATION, CREATE_HIGHLIGHT } from './context-menu-entries'

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

        options.createContextMenuEntry({
            ...CREATE_ANNOTATION,
            onclick: (_, tab) => this.createAnnotationInTab(tab.id),
        })

        options.createContextMenuEntry({
            ...CREATE_HIGHLIGHT,
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
        runInTab<InPageUIContentScriptRemoteInterface>(tabId).createHighlight()

    private createAnnotationInTab = (tabId: number) =>
        runInTab<InPageUIContentScriptRemoteInterface>(tabId).createAnnotation()
}
