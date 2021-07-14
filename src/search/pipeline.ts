import normalizeUrl from '@worldbrain/memex-url-utils/lib/normalize'
import { default as transformUrl } from '@worldbrain/memex-url-utils/lib/extract-parts'

import transformPageText from '../util/transform-page-text'
import { DEFAULT_TERM_SEPARATOR, extractContent } from './util'
import { PipelineReq, PipelineRes } from './types'

export { transformUrl }

export type PagePipeline = (req: PipelineReq) => Promise<PipelineRes>

export class PipelineError extends Error {}

/**
 * @returns Set of "words-of-interest" - determined by pre-proc logic in `transformPageText` - extracted from `text`.
 */
export function extractTerms(text: string): Set<string> {
    if (!text || !text.length) {
        return new Set()
    }

    const { text: transformedText } = transformPageText({ text })

    if (!transformedText || !transformedText.length) {
        return new Set()
    }

    return new Set(
        extractContent(transformedText, {
            separator: DEFAULT_TERM_SEPARATOR,
        }),
    )
}

/**
 * Given some page data, applies some transformations to the text and
 * returns page data ready for creation of new Page model instance.
 *
 * @returns Resolves to an object containing all data needed for Page model.
 */
const pipeline: PagePipeline = ({
    pageDoc: { content = {}, url, getFullText, ...data },
    rejectNoContent = true,
}) => {
    // First apply transformations to the URL
    const transformedUrl = transformUrl(url)
    const { pathname, hostname, domain } = transformedUrl

    // Throw error if no searchable content; we don't really want to index these (for now) so allow callers
    //  to handle (probably by ignoring)
    if (
        rejectNoContent &&
        (content == null || !content.fullText || !content.fullText.length)
    ) {
        return Promise.reject(
            new PipelineError('Page has no searchable content'),
        )
    }

    // Extract all terms out of processed content
    const terms = [...extractTerms(content.fullText)]
    const titleTerms = [...extractTerms(content.title)]
    const urlTerms = [...extractTerms(pathname)]

    return Promise.resolve({
        url: normalizeUrl(url),
        fullUrl: url,
        fullTitle: content.title,
        text: content.fullText,
        terms,
        urlTerms,
        titleTerms,
        domain,
        hostname,
        tags: [],
        ...data,
    })
}

export default pipeline
