import { runtime as runtimeAPI } from 'webextension-polyfill'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import {
    extractRawPDFContent,
    extractRawPageContent as _extractRawPageContent,
} from './extract-page-content'
import { isUrlPDFViewerUrl } from 'src/pdf/util'

export const setupPageContentRPC = () => {
    makeRemotelyCallable({
        extractRawPageContent: async (doc = document, url = location.href) => {
            if (isUrlPDFViewerUrl(url, { runtimeAPI })) {
                return extractRawPDFContent(doc, url)
            }
            return _extractRawPageContent(doc, url)
        },
    })
}
