pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker.min.js'

async function main(searchQuery = '') {
    const container = document.getElementById('pdf-viewer-container')

    const eventBus = new pdfjsViewer.EventBus()

    // (Optionally) enable hyperlinks within PDF files.
    const pdfLinkService = new pdfjsViewer.PDFLinkService({ eventBus })

    // (Optionally) enable find controller.
    const pdfFindController = new pdfjsViewer.PDFFindController({
        eventBus,
        linkService: pdfLinkService,
    })

    const pdfViewer = new pdfjsViewer.PDFViewer({
        container,
        eventBus,
        linkService: pdfLinkService,
        findController: pdfFindController,
    })
    pdfLinkService.setViewer(pdfViewer)

    eventBus.on('pagesinit', () => {
        // We can use pdfViewer now, e.g. let's change default scale.
        pdfViewer.currentScaleValue = 'page-width'

        // We can try searching for things.
        if (searchQuery) {
            pdfFindController.executeCommand('find', { query: searchQuery })
        }
    })

    const url = derivePdfUrl()
    console.log('PDF URL:', url)
    // Loading document.
    const pdfDocument = await pdfjsLib.getDocument({ url }).promise

    // Document loaded, specifying document for the viewer and
    // the (optional) linkService.
    pdfViewer.setDocument(pdfDocument)

    pdfLinkService.setDocument(pdfDocument, null)
}

function derivePdfUrl() {
    const url = new URL(location.href)
    return url.searchParams.get('file')
}

main()
