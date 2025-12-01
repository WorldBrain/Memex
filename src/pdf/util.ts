import { PDF_VIEWER_HTML } from './constants'

export const constructPDFViewerUrl = (
    urlToPdf: string,
    args: { runtimeAPI: typeof chrome.runtime },
): string =>
    args.runtimeAPI.getURL(PDF_VIEWER_HTML) +
    '?file=' +
    encodeURIComponent(urlToPdf) +
    '#pagemode=none' // this removes the sidebar to open by default

export const isUrlPDFViewerUrl = (
    url: string,
    args: { runtimeAPI: typeof chrome.runtime },
): boolean => {
    const pdfViewerUrl = args.runtimeAPI.getURL(PDF_VIEWER_HTML)
    return url.includes(pdfViewerUrl)
}

export async function openPDFInViewer(
    fullPdfUrl: string,
    args: {
        tabsAPI: typeof chrome.tabs
        runtimeAPI: typeof chrome.runtime
    },
): Promise<void> {
    const url = constructPDFViewerUrl(fullPdfUrl, {
        runtimeAPI: args.runtimeAPI,
    })
    await args.tabsAPI.create({ url })
}
