import { ContentScriptsInterface } from './types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
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
            ({ tabId }) =>
                this.options.injectScriptInTab(tabId, {
                    file: `/content_script.js`,
                }),
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
