import type { WebRequest, Tabs, Storage } from 'webextension-polyfill-ts'
import { BrowserSettingsStore } from 'src/util/settings'
import { PDF_VIEWER_HTML } from '../constants'

export interface PDFSettings {
    shouldAutomaticallyOpen?: boolean
}

export interface PDFInterface {
    refreshSetting(): Promise<void>
}

export class PDFBackground {
    private routeViewer: string
    private settingsStore: BrowserSettingsStore<PDFSettings>
    private shouldOpen: boolean
    remoteFunctions: PDFInterface

    constructor(
        private deps: {
            extensionGetURL: (url: string) => string
            tabs: Tabs.Static
            localBrowserStorage: Storage.LocalStorageArea
            webRequestAPI: WebRequest.Static
        },
    ) {
        this.routeViewer = deps.extensionGetURL(PDF_VIEWER_HTML)
        this.settingsStore = new BrowserSettingsStore<PDFSettings>(
            deps.localBrowserStorage,
            { prefix: 'PDFSettings_' },
        )
        this.remoteFunctions = {
            refreshSetting: this.refreshSetting,
        }
    }

    listener = (details) => {
        if (this.shouldOpen && details.url) {
            let url = this.routeViewer + '?file=' + details.url
            const i = details.url.indexOf('#')
            if (i > 0) {
                url += details.url.slice(i)
            }

            // to get around the blocked state of the request, we update the original tab with the account screen.
            // this is probably a bit glitchy at first, but we may be able to improve on that experience. For now it should be OK.
            setTimeout(() => {
                this.deps.tabs.update(details.tabId, { active: true, url })
            }, 1)

            return { redirectUrl: url }
        }
        return undefined
    }

    setupRequestInterceptors = async () => {
        await this.refreshSetting()
        this.deps.webRequestAPI.onBeforeRequest.addListener(
            this.listener,
            {
                types: ['main_frame', 'sub_frame'],
                urls: ['http://*/*.pdf', 'https://*/*.pdf'],
            },
            ['blocking'],
        )
    }

    refreshSetting = async () => {
        this.shouldOpen =
            (await this.settingsStore.get('shouldAutomaticallyOpen')) ?? true
    }
}
