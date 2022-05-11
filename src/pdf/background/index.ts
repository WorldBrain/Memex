import type { WebRequest, Tabs, Runtime } from 'webextension-polyfill-ts'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import type { PDFRemoteInterface } from './types'
import { PDF_VIEWER_HTML } from '../constants'

export class PDFBackground {
    private routeViewer: string
    private _shouldOpen: boolean
    private _shouldOpenOneTime: boolean
    remoteFunctions: PDFRemoteInterface

    constructor(
        private deps: {
            tabsAPI: Pick<Tabs.Static, 'update'>
            runtimeAPI: Pick<Runtime.Static, 'getURL'>
            webRequestAPI: Pick<
                WebRequest.Static,
                'onBeforeRequest' | 'onHeadersReceived'
            >
            syncSettings: SyncSettingsStore<'pdfIntegration'>
        },
    ) {
        this.routeViewer = deps.runtimeAPI.getURL(PDF_VIEWER_HTML)
        this.remoteFunctions = {
            refreshSetting: this.refreshSetting,
            openPdfViewerForNextPdf: async () => {
                this._shouldOpenOneTime = true
            },
            doNotOpenPdfViewerForNextPdf: async () => {
                this._shouldOpenOneTime = false
            },
        }
    }

    private get shouldOpen(): boolean {
        if (this._shouldOpenOneTime === true) {
            this._shouldOpenOneTime = null
            return true
        }

        if (this._shouldOpenOneTime === false) {
            this._shouldOpenOneTime = null
            return false
        }
        return this._shouldOpen
    }

    private refreshSetting = async () => {
        const storedSetting = await this.deps.syncSettings.pdfIntegration.get(
            'shouldAutoOpen',
        )
        this._shouldOpen = storedSetting ?? false
    }

    private doRedirect(requestUrl: string, tabId: number) {
        const url = this.routeViewer + '?file=' + encodeURIComponent(requestUrl)
        // console.log('Redirecting ' + details.url + ' to ' + url)

        // to get around the blocked state of the request, we update the original tab with the account screen.
        // this is probably a bit glitchy at first, but we may be able to improve on that experience. For now it should be OK.
        setTimeout(() => {
            this.deps.tabsAPI.update(tabId, { active: true, url })
        }, 1)

        return { redirectUrl: url }
    }

    private beforeRequestListener = (
        details: WebRequest.OnBeforeRequestDetailsType,
    ) => {
        // only called for local files matching *.pdf
        if (!this.shouldOpen || !details.url) {
            this._shouldOpenOneTime = null
            return
        }

        return this.doRedirect(details.url, details.tabId)
    }

    private headersReceivedListener = (
        details: WebRequest.OnHeadersReceivedDetailsType,
    ) => {
        if (!this.shouldOpen || !details.url) {
            this._shouldOpenOneTime = null
            return
        }
        if (!this.isPdfRequestForViewer(details)) {
            this._shouldOpenOneTime = null
            return
        }

        return this.doRedirect(details.url, details.tabId)
    }

    private isPdfRequestForViewer(
        details: WebRequest.OnHeadersReceivedDetailsType,
    ) {
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

    setupRequestInterceptors = async () => {
        await this.refreshSetting()
        this.deps.webRequestAPI.onBeforeRequest.addListener(
            this.beforeRequestListener,
            {
                types: ['main_frame', 'sub_frame'],
                urls: ['file://*/*.pdf'],
            },
            ['blocking'],
        )
        this.deps.webRequestAPI.onHeadersReceived.addListener(
            this.headersReceivedListener,
            {
                urls: ['<all_urls>'],
                types: ['main_frame', 'sub_frame'],
            },
            ['responseHeaders', 'blocking'],
        )
    }
}
