// Run PDF.js to extract text from each page and read document metadata.
async function extractContent(pdfData) {
    require('pdfjs-dist') /* global PDFJS */

    // Point PDF.js to its worker code.
    PDFJS.workerSrc = browser.extension.getURL('/lib/pdf.worker.min.js')

    // Load PDF document into PDF.js
    const pdf = await PDFJS.getDocument(pdfData)

    // [1..N] array for N pages
    const pages = [...Array(pdf.pdfInfo.numPages + 1).keys()].slice(1)

    // promises for page contents
    const pageTextPromises = pages.map(async i => {
        const page = await pdf.getPage(i)
        // wait for object containing items array with text pieces
        const pageItems = await page.getTextContent()
        const pageText = pageItems.items.map(item => item.str).join(' ')
        return pageText
    })

    const pageTexts = await Promise.all(pageTextPromises)
    const textContent = pageTexts.join('\n')

    const metadata = await pdf.getMetadata()

    return {
        text: {
            textContent,
        },
        metadata: metadata.info,
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
