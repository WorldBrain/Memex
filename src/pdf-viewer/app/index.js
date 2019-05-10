/* eslint no-undef: 0 */

async function renderPageContent({
    parentDiv,
    page,
    scale,
    pageClass,
    canvasClass,
    textLayerClass,
}) {
    const div = document.createElement('div')

    div.setAttribute('id', 'page-' + (page.pageIndex + 1))
    div.setAttribute('style', 'position: relative')
    div.setAttribute('class', pageClass)

    parentDiv.appendChild(div)

    const canvas = document.createElement('canvas')
    const viewport = page.getViewport(scale)

    div.appendChild(canvas)

    canvas.setAttribute('class', canvasClass)
    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
        canvasContext: canvas.getContext('2d'),
        viewport,
    })

    // Render a text layer so text is selectable
    const textLayerDiv = document.createElement('div')
    textLayerDiv.setAttribute('class', `textLayer ${textLayerClass}`)
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
    containerId: 'pdf-viewer-container',
    scale: 2,
    pageClass: 'pdf-viewer__page',
    canvasClass: 'pdf-viewer__canvas',
    textLayerClass: 'pdf-viewer__text-layer',
})
