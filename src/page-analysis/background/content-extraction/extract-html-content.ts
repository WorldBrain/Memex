import transformPageHTML from 'src/util/transform-page-html'
import { RawHtmlPageContent } from '../../types'
import PAGE_METADATA_RULES from '../../page-metadata-rules'

const pick = keys => obj =>
    Object.assign({}, ...keys.map(key => ({ [key]: obj[key] })))

export default function extractHtmlContent(rawContent: RawHtmlPageContent) {
    // Apply simple transformations to clean the page's HTML
    const { text: processedHtml } = transformPageHTML({
        html: rawContent.body,
    })

    return {
        fullText: processedHtml,
        lang: rawContent.lang,
        // Picking desired fields, as getMetadata adds some unrequested stuff.
        ...pick(Object.keys(PAGE_METADATA_RULES))(rawContent.metadata),
    }
}
