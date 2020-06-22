import { browser } from 'webextension-polyfill-ts'
import transformPageText from 'src/util/transform-page-text'
import PdfViewerBackground from 'src/pdf-viewer/background'
// import { remoteFunction } from 'src/util/webextensionRPC'

// const getPdfDataRPC = remoteFunction('getPdfData')

// Given a PDF as blob or URL, return a promise of its text and metadata.
export default async function extractPdfContent(url: string) {
    // Fetch document if only a URL is given.
    // const { text, ...metadata } = await remoteFunction('getPdfData')(url)
    const pdfViewer = new PdfViewerBackground({})
    const { text, ...metadata } = await pdfViewer.getPdfData(url)

    const { text: fullText } = transformPageText({ text })
    return { ...metadata, fullText }
}
