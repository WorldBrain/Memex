export interface MemexPDFMetadata {
    memexTotalPages: number
    memexIncludedPages: number
    memexDocumentBytes?: number
    /** This value mirrors what's returned from PDFJS's PDFDocumentProxy.getOutline */
    memexOutline?: any[]
    metadataMap?: any
    documentInformationDict?: any
    fingerprints: string[]
}
