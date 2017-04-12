// Returns an Object containing PDF Text and MetaData
async function getDatafromBlob(blob) {
    require('pdfjs-dist')

    // workerSrc needs to be specified, PDFJS library uses
    // Document.currentScript which is disallowed by content scripts
    PDFJS.workerSrc = browser.extension.getURL('/lib/pdf.worker.min.js')

    // wait for document to load
    const pdf = await PDFJS.getDocument(blob.target.result)

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

    // wait for all promises to be fulfilled
    const pageTexts = await Promise.all(pageTextPromises)
    const totalContent = pageTexts.join('\n')

    // wait for metadata
    const data = await pdf.getMetadata()

    return {
        pageText: { bodyInnerText: totalContent },
        pageMetaData: data.info,
    }
}

// Return promise for PDF data
export default async function extractPdfContent({url, blob}) {
    // fetch blob if not given
    if (blob === undefined) {
        const response = await fetch(url)
        blob = await response.blob()
    }

    return new Promise(function (resolve, reject) {
        const fileReader = new FileReader()
        fileReader.onload = (blob) => resolve(getDatafromBlob(blob))
        fileReader.readAsArrayBuffer(blob)
    })
}
