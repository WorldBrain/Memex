import { browser } from 'webextension-polyfill-ts'
import PDFJS from 'pdfjs-dist'
import transformPageText from 'src/util/transform-page-text'

// Run PDF.js to extract text from each page and read document metadata.
async function extractContent(pdfData) {
    // Point PDF.js to its worker code, a static file in the extension.
    PDFJS.workerSrc = browser.extension.getURL('/lib/pdf.worker.min.js')

    // Load PDF document into PDF.js
    const pdf = await PDFJS.getDocument(pdfData)

    // Read text from pages one by one (in parallel may be too heavy).
    const pageTexts = []
    for (let i = 1; i <= pdf.pdfInfo.numPages; i++) {
        const page = await pdf.getPage(i)
        // wait for object containing items array with text pieces
        const pageItems = await page.getTextContent()
        const pageText = pageItems.items.map(item => item.str).join(' ')
        pageTexts.push(pageText)
    }

    // Run the joined texts through our pipeline
    const { text: processedText } = transformPageText({
        text: pageTexts.join(' '),
    })

    const metadata = await pdf.getMetadata()

    return {
        fullText: processedText,
        author: metadata.info.Author,
        title: metadata.info.Title,
        keywords: metadata.info.Keywords,
    }
}

// Given a PDF as blob or URL, return a promise of its text and metadata.
export default async function extractPdfContent(
    input: { url: string } | { blob: Blob },
) {
    // Fetch document if only a URL is given.
    let blob = 'blob' in input ? input.blob : undefined

    if (!('blob' in input)) {
        const response = await fetch(input.url)

        if (response.status >= 400 && response.status < 600) {
            return Promise.reject(
                new Error(`Bad response from server: ${response.status}`),
            )
        }

        blob = await response.blob()
    }

    const pdfData = new Promise(function(resolve, reject) {
        const fileReader = new FileReader()
        fileReader.onload = async event => {
            resolve(event.target.result)
        }
        fileReader.onerror = event => reject(event.target.error)
        fileReader.readAsArrayBuffer(blob)
    })

    const pdfContent = await extractContent(pdfData)
    return pdfContent
}
