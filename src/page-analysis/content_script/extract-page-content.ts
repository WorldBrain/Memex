import { getMetadata } from 'page-metadata-parser'
import PAGE_METADATA_RULES from '../page-metadata-rules'
import type {
    ExtractRawPageContent,
    RawHtmlPageContent,
    RawPdfPageContent,
} from '../types'
import { getUnderlyingResourceUrl } from 'src/util/uri-utils'

export const DEF_LANG = 'en'

/**
 * Extracts content from the DOM, both searchable terms and other metadata.
 */
export const extractRawPageContent: ExtractRawPageContent<RawHtmlPageContent> = (
    doc,
    url,
) => {
    return {
        url,
        type: 'html',
        body: doc.body.innerHTML,
        lang: doc.documentElement.lang ?? DEF_LANG,
        metadata: getMetadata(doc, url, PAGE_METADATA_RULES),
    }
}

export const extractRawPDFContent: ExtractRawPageContent<RawPdfPageContent> = (
    doc,
    url,
) => {
    const underlyingResourceUrl = getUnderlyingResourceUrl(url)
    return {
        type: 'pdf',
        title: document.title ?? undefined,
        url: underlyingResourceUrl,
    }
}
