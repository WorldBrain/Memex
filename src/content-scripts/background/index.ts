import { ContentScriptsInterface } from './types'
import { makeRemotelyCallable, runInTab } from 'src/util/webextensionRPC'
import { InPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { Tabs, WebNavigation } from 'webextension-polyfill-ts'

export class ContentScriptsBackground {
    remoteFunctions: ContentScriptsInterface<'provider'>

    constructor(
        private options: {
            injectScriptInTab: (
                tabId: number,
                options: { file: string },
            ) => void
            getTab: Tabs.Static['get']
            webNavigation: WebNavigation.Static
        },
    ) {
        this.remoteFunctions = {
            injectContentScriptComponent: this.injectContentScriptComponent,
            getCurrentTab: async ({ tab }) => ({
                id: tab.id,
                url: (await options.getTab(tab.id)).url,
            }),
        }

        this.options.webNavigation.onHistoryStateUpdated.addListener(
            async ({ tabId }) => {
                const inPage = runInTab<InPageUIContentScriptRemoteInterface>(
                    tabId,
                )

                await inPage.removeHighlights()
                await inPage.reloadRibbon()
            },
        )
    }

    setupRemoteFunctions() {
        makeRemotelyCallable(this.remoteFunctions, { insertExtraArg: true })
    }

    injectContentScriptComponent: ContentScriptsInterface<
        'provider'
    >['injectContentScriptComponent'] = async ({ tab }, { component }) => {
        this.options.injectScriptInTab(tab.id, {
            file: `/content_script_${component}.js`,
        })
    }
}
