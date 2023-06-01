import PAGE_METADATA_RULES from '../../page-metadata-rules'
import { transformPageHTML } from '@worldbrain/memex-stemmer/lib/transform-page-html'
import type { PageContent } from 'src/search'
import type {
    RawHtmlPageContent,
    RawPageContent,
} from 'src/page-analysis/types'

const pick = (keys: string[]) => (obj: { [key: string]: string }) =>
    Object.assign({}, ...keys.map((key) => ({ [key]: obj[key] })))

export default function extractPageMetadataFromRawContent(
    rawContent: RawHtmlPageContent,
): PageContent & {
    pdfMetadata?: { [key: string]: any }
    pdfPageTexts?: string[]
} {
    return {
        lang: rawContent.lang,
        // Picking desired fields, as getMetadata adds some unrequested stuff.
        ...pick(Object.keys(PAGE_METADATA_RULES))(rawContent.metadata),
    }
}

export function getPageFullText(
    rawContent: RawPageContent,
    metadata: PageContent,
): string {
    return rawContent.type === 'html'
        ? transformPageHTML({
              html: rawContent.body,
          }).text
        : metadata.fullText
}
