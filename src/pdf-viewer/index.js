/* eslint no-undef: 0 */

async function renderPageContent({ parentDiv, page, scale }) {
    const div = document.createElement('div')

    div.setAttribute('id', 'page-' + (page.pageIndex + 1))
    div.setAttribute('style', 'position: relative')

    parentDiv.appendChild(div)

    const canvas = document.createElement('canvas')
    const viewport = page.getViewport(scale)

    div.appendChild(canvas)

    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
        canvasContext: canvas.getContext('2d'),
        viewport,
    })

    // Render a text layer so text is selectable
    const textLayerDiv = document.createElement('div')
    textLayerDiv.setAttribute('class', 'textLayer')
    div.appendChild(textLayerDiv)

    await PDFJS.renderTextLayer({
        textContent: await page.getTextContent(),
        container: textLayerDiv,
        viewport,
    })
}

async function renderPDFViewer({ pdfUrl, containerId, ...args }) {
    const pdf = await PDFJS.getDocument(pdfUrl)
    const container = document.getElementById(containerId)

    for (let pageNum = 1; pageNum <= pdf.numPages; ++pageNum) {
        await renderPageContent({
            parentDiv: container,
            page: await pdf.getPage(pageNum),
            ...args,
        })
    }
}

function derivePdfUrl() {
    const url = new URL(location.href)
    return url.searchParams.get('file')
}

renderPDFViewer({
    pdfUrl: derivePdfUrl(),
    containerId: 'pdf-container',
    scale: 2,
})
