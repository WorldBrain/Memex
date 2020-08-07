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
                try {
                    await runInTab<InPageUIContentScriptRemoteInterface>(
                        tabId,
                    ).removeRibbon()
                } catch (err) {
                    console.log(
                        'BG: got an error in content script when removing ribbon',
                    )
                }

                try {
                    await runInTab<InPageUIContentScriptRemoteInterface>(
                        tabId,
                    ).removeTooltip()
                } catch (err) {
                    console.log(
                        'BG: got an error in content script when removing tooltip',
                    )
                }

                this.options.injectScriptInTab(tabId, {
                    file: `/content_script.js`,
                })
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
