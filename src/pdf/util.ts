import type { Tabs, Runtime } from 'webextension-polyfill'
import { PDF_VIEWER_HTML } from './constants'

export const constructPDFViewerUrl = (
    urlToPdf: string,
    args: { runtimeAPI: Pick<Runtime.Static, 'getURL'> },
): string =>
    args.runtimeAPI.getURL(PDF_VIEWER_HTML) +
    '?file=' +
    encodeURIComponent(urlToPdf) +
    '#pagemode=none' // this removes the sidebar to open by default

export const isUrlPDFViewerUrl = (
    url: string,
    args: { runtimeAPI: Pick<Runtime.Static, 'getURL'> },
): boolean => {
    const pdfViewerUrl = args.runtimeAPI.getURL(PDF_VIEWER_HTML)
    return url.includes(pdfViewerUrl)
}

export async function openPDFInViewer(
    fullPdfUrl: string,
    args: {
        tabsAPI: Tabs.Static
        runtimeAPI: Runtime.Static
    },
): Promise<void> {
    const url = constructPDFViewerUrl(fullPdfUrl, {
        runtimeAPI: args.runtimeAPI,
    })
    await args.tabsAPI.create({ url })
}
