export interface PDFRemoteInterface {
    refreshSetting(): Promise<void>
    openPdfViewerForNextPdf(): Promise<void>
}
