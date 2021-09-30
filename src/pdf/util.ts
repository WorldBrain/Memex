import type { Runtime } from 'webextension-polyfill-ts'
import { PDF_VIEWER_HTML } from './constants'

export const constructPDFViewerUrl = (
    urlToPdf: string,
    args: { runtimeAPI: Pick<Runtime.Static, 'getURL'> },
): string => args.runtimeAPI.getURL(PDF_VIEWER_HTML) + '?file=' + urlToPdf

export const isUrlPDFViewerUrl = (
    url: string,
    args: { runtimeAPI: Pick<Runtime.Static, 'getURL'> },
): boolean => {
    const pdfViewerUrl = args.runtimeAPI.getURL(PDF_VIEWER_HTML)
    return url.includes(pdfViewerUrl)
}
