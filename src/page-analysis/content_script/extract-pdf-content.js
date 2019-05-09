import { remoteFunction } from 'src/util/webextensionRPC'
import transformPageText from 'src/util/transform-page-text'

const getPdfDataRPC = remoteFunction('getPdfData')

// Given a PDF as blob or URL, return a promise of its text and metadata.
export default async function extractPdfContent({ url }) {
    const { text, ...metadata } = await getPdfDataRPC(url)

    // Run the text through our pipeline
    const { text: fullText } = transformPageText({ text })

    return { ...metadata, fullText }
}
