// Returns a promise for an Object containing PDF Text and MetaData
function getData(blob) {
    return new Promise(function (resolve, reject) {
        var fileReader = new FileReader()
        fileReader.onload = async function (blob) {
            require('pdfjs-dist')
            require('fs')

            // workerSrc needs to be specified, PDFJS library uses
            // Document.currentScript which is disallowed by content scripts
            PDFJS.workerSrc = browser.extension.getURL('pdf-worker/pdf.worker.min.js')

            // wait for document to load
            let pdf = await PDFJS.getDocument(blob.target.result)

            var totalContent = []
            var promises = []
            collectContent()
            function collectContent() {
                for (var i = 1; i <= pdf.pdfInfo.numPages; i++) {
                    promises.push(getPageContentForIndex(i, function(content) {
                        totalContent.push(content)
                    }))
                }
            }
            function getPageContentForIndex(i, callback) {
                return pdf.getPage(i).then(function(page) {
                    return page.getTextContent().then(function(textContent) {
                        var pageContent = textContent.items.map((item) => item.str).join(' ')
                        callback(pageContent)
                    })
                })
            }

            // wait for all promises of page contents
            await Promise.all(promises)
            totalContent = totalContent.join(' ')

            // wait for metadata
            let data = await pdf.getMetadata()

            resolve(
                {
                    pageText: { bodyInnerText: totalContent },
                    pageMetaData: JSON.parse(JSON.stringify(data.info, null, 2)),
                })
        }
        fileReader.readAsArrayBuffer(blob)
    })
}

// fetch file and return data
export default async function extractPdfData(url) {
    let response = await fetch(url)
    let blob = await response.blob()

    return getData(blob)
}
