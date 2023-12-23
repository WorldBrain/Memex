import type { WebRequest, Tabs, Runtime, Storage } from 'webextension-polyfill'
import type {
    PdfUploadServiceInterface,
    RequestPdfSuccessResult,
} from '@worldbrain/memex-common/lib/pdf/uploads/types'
import type { SyncSettingsStore } from '../../sync-settings/util'
import type PageStorage from '../../page-indexing/background/storage'
import type { PDFRemoteInterface } from './types'
import { PDF_VIEWER_HTML } from '../constants'
import {
    ContentLocatorFormat,
    ContentLocatorType,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { PagePutHandler } from 'src/page-indexing/background/types'
import { runInTab } from 'src/util/webextensionRPC'
import type { InPDFPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import type { ContentIdentifier } from 'src/search'

export class PDFBackground {
    static OPEN_PDF_VIEWER_ONE_TIME_KEY =
        '@PDFViewer-should_use_viewer_next_open'

    private routeViewer: string
    private _shouldOpen: boolean
    remoteFunctions: PDFRemoteInterface

    constructor(
        private deps: {
            tabsAPI: Pick<Tabs.Static, 'update'>
            storageAPI: Pick<Storage.Static, 'local'>
            runtimeAPI: Pick<Runtime.Static, 'getURL'>
            pdfUploads: PdfUploadServiceInterface
            generateUploadId: () => string | number
            webRequestAPI: Pick<
                WebRequest.Static,
                'onBeforeRequest' | 'onHeadersReceived'
            >
            syncSettings: SyncSettingsStore<'pdfIntegration'>
            pageStorage: PageStorage
        },
    ) {
        this.routeViewer = deps.runtimeAPI.getURL(PDF_VIEWER_HTML)
        this.remoteFunctions = {
            refreshSetting: this.refreshSetting,
            openPdfViewerForNextPdf: async () => {
                await deps.storageAPI.local.set({
                    [PDFBackground.OPEN_PDF_VIEWER_ONE_TIME_KEY]: true,
                })
            },
            doNotOpenPdfViewerForNextPdf: async () => {
                await deps.storageAPI.local.set({
                    [PDFBackground.OPEN_PDF_VIEWER_ONE_TIME_KEY]: false,
                })
            },
        }
    }

    private async shouldOpenPDFViewer(): Promise<boolean | null> {
        const { storageAPI } = this.deps
        const {
            [PDFBackground.OPEN_PDF_VIEWER_ONE_TIME_KEY]: shouldOpenOneTime,
        } = await storageAPI.local.get(
            PDFBackground.OPEN_PDF_VIEWER_ONE_TIME_KEY,
        )

        if (shouldOpenOneTime != null) {
            await storageAPI.local.set({
                [PDFBackground.OPEN_PDF_VIEWER_ONE_TIME_KEY]: null,
            })
            return shouldOpenOneTime
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

    private beforeRequestListener = async (
        details: WebRequest.OnBeforeRequestDetailsType,
    ) => {
        // only called for local files matching *.pdf
        if (!details.url || !(await this.shouldOpenPDFViewer())) {
            return
        }

        return this.doRedirect(details.url, details.tabId)
    }

    private headersReceivedListener = async (
        details: WebRequest.OnHeadersReceivedDetailsType,
    ) => {
        if (
            !details.url ||
            !(await this.shouldOpenPDFViewer()) ||
            !this.isPdfRequestForViewer(details)
        ) {
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

    handlePagePut: PagePutHandler = async (event) => {
        if (event.isNew && event.isPdf && event.tabId) {
            const isAutoUploadEnabled = await this.deps.syncSettings.pdfIntegration.get(
                'shouldAutoUpload',
            )
            if (!isAutoUploadEnabled) {
                return
            }
            await this.uploadPdf({
                tabId: event.tabId,
                identifier: event.identifier,
            })
        }
    }

    private uploadPdf = async (params: {
        tabId: number
        identifier: ContentIdentifier
    }) => {
        const data = await runInTab<InPDFPageUIContentScriptRemoteInterface>(
            params.tabId,
        ).getPDFRawData()
        if (!data) {
            throw new Error(
                `Could not get raw data for current PDF - tab ID: ${params.tabId}, url: ${params.identifier.fullUrl}`,
            )
        }

        const existingLocators = await this.deps.pageStorage.findLocatorsByNormalizedUrl(
            params.identifier.normalizedUrl,
        )
        const existingStorageLocator = existingLocators.find(
            (loc) => loc.locationScheme === LocationSchemeType.UploadStorage,
        )
        let uploadId = existingStorageLocator?.location
        if (!uploadId) {
            uploadId = this.deps.generateUploadId() as string
            await this.deps.pageStorage.storeLocators({
                identifier: params.identifier,
                locators: [
                    {
                        format: ContentLocatorFormat.PDF,
                        location: uploadId,
                        locationScheme: LocationSchemeType.UploadStorage,
                        locationType: ContentLocatorType.Remote,
                        normalizedUrl: params.identifier.normalizedUrl,
                        originalLocation: params.identifier.fullUrl,
                        primary: true,
                        valid: true,
                        status: 'uploading',
                        version: 0,
                    },
                ],
            })
        }
        if (existingStorageLocator?.status === 'uploaded') {
            return
        }
        const tokenResult = await this.deps.pdfUploads.getUploadToken({
            uploadId,
        })
        if (tokenResult.error) {
            throw new Error(
                `Got error while trying to get PDF upload token: ${tokenResult.error}`,
            )
        }
        const { token } = tokenResult as RequestPdfSuccessResult
        await this.deps.pdfUploads.uploadPdfContent({
            token,
            content: data,
        })

        await this.deps.pageStorage.updateLocatorStatus({
            locationScheme: LocationSchemeType.UploadStorage,
            normalizedUrl: params.identifier.normalizedUrl,
            status: 'uploaded',
        })
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
