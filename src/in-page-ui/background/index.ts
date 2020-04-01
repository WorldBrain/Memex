import { Tabs } from 'webextension-polyfill-ts'
import { bindMethod } from 'src/util/functions'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIInterface } from './types'
import { InPageUIContentScriptRemoteInterface } from '../content_script/types'

export class InPageUIBackground implements InPageUIInterface<'provider'> {
    remoteFunctions: InPageUIInterface<'provider'>

    constructor(private options: { queryTabs: Tabs.Static['query'] }) {
        this.remoteFunctions = {
            showSidebar: bindMethod(this, 'showSidebar'),
        }
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
}
