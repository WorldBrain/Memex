import { RawHtmlPageContent } from '../../types'
import PAGE_METADATA_RULES from '../../page-metadata-rules'

const pick = keys => obj =>
    Object.assign({}, ...keys.map(key => ({ [key]: obj[key] })))

export default function extractHtmlContent(rawContent: RawHtmlPageContent) {
    return {
        lang: rawContent.lang,
        // Picking desired fields, as getMetadata adds some unrequested stuff.
        ...pick(Object.keys(PAGE_METADATA_RULES))(rawContent.metadata),
    }
}
