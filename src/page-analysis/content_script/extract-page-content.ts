import { getUnderlyingResourceUrl } from 'src/util/uri-utils'
import type {
    ExtractRawPageContent,
    RawPdfPageContent,
} from '@worldbrain/memex-common/lib/page-indexing/content-extraction/types'

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
