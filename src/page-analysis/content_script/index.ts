import { runtime as runtimeAPI } from 'webextension-polyfill'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import { isUrlPDFViewerUrl } from 'src/pdf/util'
import { extractRawPDFContent } from './extract-page-content'
import { extractRawPageContent as _extractRawPageContent } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/extract-page-content'

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
