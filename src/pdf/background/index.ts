import type { Tabs, Runtime, Storage } from 'webextension-polyfill'
import type {
    PdfUploadServiceInterface,
    RequestPdfSuccessResult,
} from '@worldbrain/memex-common/lib/pdf/uploads/types'
import type { SyncSettingsStore } from '../../sync-settings/util'
import type PageStorage from '../../page-indexing/background/storage'
import type { PDFRemoteInterface } from './types'
import {
    ContentLocatorFormat,
    ContentLocatorType,
    LocationSchemeType,
} from '@worldbrain/memex-common/lib/personal-cloud/storage/types'
import type { PagePutHandler } from 'src/page-indexing/background/types'
import { runInTab } from 'src/util/webextensionRPC'
import type { InPDFPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import type { ContentIdentifier } from 'src/search'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { RETRIEVE_PDF_ROUTE } from '@worldbrain/memex-common/lib/pdf/uploads/constants'

export class PDFBackground {
    static OPEN_PDF_VIEWER_ONE_TIME_KEY =
        '@PDFViewer-should_use_viewer_next_open'

    remoteFunctions: PDFRemoteInterface

    constructor(
        private deps: {
            tabsAPI: Pick<Tabs.Static, 'update'>
            storageAPI: Pick<Storage.Static, 'local'>
            runtimeAPI: Pick<Runtime.Static, 'getURL'>
            pdfUploads: PdfUploadServiceInterface
            generateUploadId: () => string | number
            syncSettings: SyncSettingsStore<'pdfIntegration'>
            pageStorage: PageStorage
            fetch: typeof fetch
            getNow: () => number
        },
    ) {
        this.remoteFunctions = {
            getTempPdfAccessUrl: this.getTempPdfAccessUrl,
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

    private getTempPdfAccessUrl: PDFRemoteInterface['getTempPdfAccessUrl'] = async (
        uploadId,
    ) => {
        const result = await this.deps.pdfUploads.getDownloadToken({
            uploadId,
        })

        const workerUrl =
            process.env.NODE_ENV === 'production'
                ? CLOUDFLARE_WORKER_URLS.production
                : CLOUDFLARE_WORKER_URLS.staging

        if ('token' in result) {
            return `${workerUrl}${RETRIEVE_PDF_ROUTE}?token=${result.token}`
        }

        throw new Error(result.error)
    }

    handlePagePut: PagePutHandler = async (event) => {
        if (event.isNew && event.isPdf && event.isLocalPdf && event.tabId) {
            // TODO: Set up PDF auto-upload as a sync setting
            // const isAutoUploadEnabled = await this.deps.syncSettings.pdfIntegration.get(
            //     'shouldAutoUpload',
            // )
            const isAutoUploadEnabled = true
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
                        lastVisited: this.deps.getNow(),
                    },
                ],
            })
        }
        if (existingStorageLocator?.status === 'uploaded') {
            return
        }
        const contentScriptRPC = runInTab<
            InPDFPageUIContentScriptRemoteInterface
        >(params.tabId)
        await contentScriptRPC.setPdfUploadState(true)

        if (process.env.NODE_ENV !== 'test') {
            const tokenResult = await this.deps.pdfUploads.getUploadToken({
                uploadId,
            })
            if (tokenResult.error) {
                throw new Error(
                    `Got error while trying to get PDF upload token: ${tokenResult.error}`,
                )
            }
            const { token } = tokenResult as RequestPdfSuccessResult
            const { objectUrl } = await contentScriptRPC.getObjectUrlForPdf()
            const response = await this.deps.fetch(objectUrl)
            const content = await response.blob()
            await this.deps.pdfUploads.uploadPdfContent({ token, content })
            URL.revokeObjectURL(objectUrl) // TODO: Need to remove this when we move to MV3
        }

        await this.deps.pageStorage.updateLocatorStatus({
            locationScheme: LocationSchemeType.UploadStorage,
            normalizedUrl: params.identifier.normalizedUrl,
            status: 'uploaded',
        })
        await contentScriptRPC.setPdfUploadState(false)
    }
}
