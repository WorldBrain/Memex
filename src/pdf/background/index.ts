import { WebRequest, Tabs, Storage } from 'webextension-polyfill-ts'
import { BrowserSettingsStore } from 'src/util/settings'
import {
    UserFeatureOptIn,
    UserFeatureOptInMap,
} from 'src/features/background/feature-opt-ins'

export interface PDFSettings {
    shouldAutomaticallyOpen?: boolean
}

export interface PDFInterface {
    refreshSetting(): Promise<void>
}

export class PDFBackground {
    private routeViewer: string
    private routeExtension: string
    private webRequest: WebRequest.Static
    private localStorage: BrowserSettingsStore<PDFSettings>
    private shouldOpen: boolean
    private tabs: Tabs.Static
    remoteFunctions: PDFInterface

    constructor(opts: {
        extensionGetURL: (url: string) => string
        tabs: Tabs.Static
        localBrowserStorage: Storage.LocalStorageArea
    }) {
        this.tabs = opts.tabs
        this.routeViewer = opts.extensionGetURL('pdfjs/viewer.html')
        this.routeExtension = opts.extensionGetURL('/')
        this.localStorage = new BrowserSettingsStore<PDFSettings>(
            opts.localBrowserStorage,
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

            // console.log('Redirecting ' + details.url + ' to ' + url)

            // to get around the blocked state of the request, we update the original tab with the account screen.
            // this is probably a bit glitchy at first, but we may be able to improve on that experience. For now it should be OK.
            setTimeout(() => {
                this.tabs.update(details.tabId, { active: true, url })
            }, 1)

            return { redirectUrl: url }
        }
        return undefined
    }

    setupRequestInterceptors = async (opts: {
        webRequest: WebRequest.Static
    }) => {
        this.webRequest = opts.webRequest
        await this.refreshSetting()
        this.webRequest.onBeforeRequest.addListener(
            this.listener,
            {
                types: ['main_frame', 'sub_frame'],
                urls: ['http://*/*.pdf', 'https://*/*.pdf'],
            },
            ['blocking'],
        )
    }

    refreshSetting = async () => {
        this.shouldOpen = await this.localStorage.get('shouldAutomaticallyOpen')
    }
}
