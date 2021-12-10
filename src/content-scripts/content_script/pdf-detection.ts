export const PDF_VIEWER_ERROR_EL_ID = 'errorWrapper'

export const setupPdfViewerListeners = (cbs: {
    onLoadError: () => Promise<void> | void
}) => {
    const pdfViewerErrorEl = document.getElementById(PDF_VIEWER_ERROR_EL_ID)
    if (!pdfViewerErrorEl) {
        return
    }

    const domErrorObserver = new MutationObserver(async (mutations) => {
        for (const mutation of mutations) {
            if (
                mutation.type === 'attributes' &&
                mutation.attributeName === 'hidden'
            ) {
                await cbs.onLoadError()
                domErrorObserver.disconnect()
            }
        }
    })

    domErrorObserver.observe(pdfViewerErrorEl, {
        attributeFilter: ['hidden'],
    })
}
