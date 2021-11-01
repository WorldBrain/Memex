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

    doRedirect(requestUrl: string, tabId: number) {
        const url = this.routeViewer + '?file=' + encodeURIComponent(requestUrl)
        // console.log('Redirecting ' + details.url + ' to ' + url)

        // to get around the blocked state of the request, we update the original tab with the account screen.
        // this is probably a bit glitchy at first, but we may be able to improve on that experience. For now it should be OK.
        setTimeout(() => {
            this.tabs.update(tabId, { active: true, url })
        }, 1)

        return { redirectUrl: url }
    }

    beforeRequestListener = (
        details: WebRequest.OnBeforeRequestDetailsType,
    ) => {
        // only called for local files matching *.pdf
        if (!this.shouldOpen || !details.url) {
            return
        }

        return this.doRedirect(details.url, details.tabId)
    }

    headersReceivedListener = (
        details: WebRequest.OnHeadersReceivedDetailsType,
    ) => {
        console.log('hr', details)
        if (!this.shouldOpen || !details.url) {
            return
        }
        if (!this.isPdfRequestForViewer(details)) {
            return
        }
        return this.doRedirect(details.url, details.tabId)
    }

    isPdfRequestForViewer(details: WebRequest.OnHeadersReceivedDetailsType) {
        if (details.url.endsWith('.pdf')) {
            return true
        }
        const contentTypeHeader = details.responseHeaders?.find?.(
            (header) => header.name.toLowerCase() === 'content-type',
        )
        if (
            contentTypeHeader?.value?.toLowerCase?.().split?.(';')?.[0] !==
            'application/pdf'
        ) {
            return false
        }
        const contentDispositionHeader = details.responseHeaders?.find?.(
            (header) => header.name.toLowerCase() === 'content-disposition',
        )
        if (
            contentDispositionHeader?.value
                ?.toLowerCase?.()
                .split?.(';')?.[0] === 'attachement'
        ) {
            return false
        }
        return true
    }

    setupRequestInterceptors = async (opts: {
        webRequest: WebRequest.Static
    }) => {
        this.webRequest = opts.webRequest
        await this.refreshSetting()
        this.webRequest.onBeforeRequest.addListener(
            this.beforeRequestListener,
            {
                types: ['main_frame', 'sub_frame'],
                urls: ['file://*/*.pdf'],
            },
            ['blocking'],
        )
        this.webRequest.onHeadersReceived.addListener(
            this.headersReceivedListener,
            {
                urls: ['<all_urls>'],
                types: ['main_frame', 'sub_frame'],
            },
            ['responseHeaders', 'blocking'],
        )
    }

    refreshSetting = async () => {
        this.shouldOpen = await this.localStorage.get('shouldAutomaticallyOpen')
    }
}
