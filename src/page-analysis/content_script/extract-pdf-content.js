// Run PDF.js to extract text from each page and read document metadata.
async function extractContent(pdfData) {
    // Import PDF.js only when needed, as it is large.
    require('pdfjs-dist') /* global PDFJS */

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

    // Join the texts of the pages with a small line, for human readability.
    const fullText = pageTexts.join('\n\n----------\n\n')

    const metadata = await pdf.getMetadata()

    return {
        fullText,
        author: metadata.info.Author,
        title: metadata.info.Title,
        keywords: metadata.info.Keywords,
    }
}

// Given a PDF as blob or URL, return a promise of its text and metadata.
export default async function extractPdfContent({url, blob}) {
    // Fetch document if only a URL is given.
    if (blob === undefined) {
        const response = await fetch(url)
        blob = await response.blob()
    }

    return new Promise(function (resolve, reject) {
        const fileReader = new FileReader()
        fileReader.onload = async event => {
            const pdfData = event.target.result
            try {
                const pdfContent = await extractContent(pdfData)
                resolve(pdfContent)
            } catch (err) {
                reject(err)
            }
        }
        fileReader.onerror = event => reject(new Error(event.target.error))
        fileReader.readAsArrayBuffer(blob)
    })
}
