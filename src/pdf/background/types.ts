export interface PDFRemoteInterface {
    openPdfViewerForNextPdf(): Promise<void>
    doNotOpenPdfViewerForNextPdf(): Promise<void>
    getTempPdfAccessUrl(uploadId: string): Promise<string>
}
