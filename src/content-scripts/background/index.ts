import { ContentScriptsInterface } from './types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

export class ContentScriptsBackground {
    remoteFunctions: ContentScriptsInterface<'provider'>

    constructor(
        private options: {
            injectScriptInTab: (
                tabId: number,
                options: { file: string },
            ) => void
        },
    ) {
        this.remoteFunctions = {
            injectContentScriptComponent: this.injectContentScriptComponent,
        }
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
