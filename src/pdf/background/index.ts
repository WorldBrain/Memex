import type { WebRequest, Tabs, Runtime } from 'webextension-polyfill-ts'
import type { SyncSettingsStore } from 'src/sync-settings/util'
import type { PDFRemoteInterface } from './types'
import { PDF_VIEWER_HTML } from '../constants'

export class PDFBackground {
    private routeViewer: string
    private shouldOpen: boolean
    remoteFunctions: PDFRemoteInterface

    constructor(
        private deps: {
            tabsAPI: Pick<Tabs.Static, 'update'>
            runtimeAPI: Pick<Runtime.Static, 'getURL'>
            webRequestAPI: Pick<WebRequest.Static, 'onBeforeRequest'>
            syncSettings: SyncSettingsStore<'pdfIntegration'>
        },
    ) {
        this.routeViewer = deps.runtimeAPI.getURL(PDF_VIEWER_HTML)
        this.remoteFunctions = {
            refreshSetting: this.refreshSetting,
        }
    }

    private refreshSetting = async () => {
        this.shouldOpen =
            (await this.deps.syncSettings.pdfIntegration.get(
                'shouldAutoOpen',
            )) ?? true
    }

    private listener = (details: WebRequest.OnBeforeRequestDetailsType) => {
        if (this.shouldOpen && details.url) {
            let url = this.routeViewer + '?file=' + details.url
            const i = details.url.indexOf('#')
            if (i > 0) {
                url += details.url.slice(i)
            }

            // to get around the blocked state of the request, we update the original tab with the account screen.
            // this is probably a bit glitchy at first, but we may be able to improve on that experience. For now it should be OK.
            setTimeout(() => {
                this.deps.tabsAPI.update(details.tabId, { active: true, url })
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
}
