import extractPageMetadataFromRawContent, {
    getPageFullText,
} from './content-extraction'
import { PageContent } from 'src/search'
import TabManagementBackground from 'src/tab-management/background'
import { RawPageContent } from '../types'

export interface PageAnalysis {
    content: PageContent
    favIconURI?: string
    htmlBody?: string
    pdfMetadata?: { [key: string]: any }
    pdfPageTexts?: string[]
}

export type PageAnalyzer = (args: {
    tabId: number
    tabManagement: Pick<
        TabManagementBackground,
        'extractRawPageContent' | 'getFavIcon'
    >
    fetch?: typeof fetch
    includeContent?: 'metadata-only' | 'metadata-with-full-text'
    includeFavIcon?: boolean
}) => Promise<PageAnalysis>

/**
 * Performs page content analysis on a given Tab's ID.
 *
 * CONTEXT: This needs to be called on a tab that is ready to be indexed.
 */
const analysePage: PageAnalyzer = async (options) => {
    const { tabId } = options
    options.includeFavIcon = options.includeFavIcon ?? true

    const extracted = await extractPageContent(options)
    const { content, rawContent } = extracted
    const favIconURI =
        options.includeFavIcon && extracted.rawContent.type !== 'pdf'
            ? await options.tabManagement.getFavIcon({ tabId })
            : undefined
    const htmlBody = rawContent.type === 'html' ? rawContent.body : undefined

    return {
        content,
        favIconURI,
        htmlBody,
        pdfMetadata: extracted.pdfMetadata,
        pdfPageTexts: extracted.pdfPageTexts,
    }
}

async function extractPageContent(options: {
    tabId: number
    tabManagement: Pick<TabManagementBackground, 'extractRawPageContent'>
    fetch?: typeof fetch
    includeContent?: 'metadata-only' | 'metadata-with-full-text'
}): Promise<
    | {
          content: PageContent
          rawContent: RawPageContent
          pdfMetadata?: PageAnalysis['pdfMetadata']
          pdfPageTexts?: PageAnalysis['pdfPageTexts']
      }
    | undefined
> {
    if (!options.includeContent) {
        return
    }

    const rawContent = await options.tabManagement.extractRawPageContent(
        options.tabId,
    )
    if (!rawContent) {
        throw new Error(`Could extract raw page content`)
    }

    const content = await extractPageMetadataFromRawContent(rawContent, {
        fetch: options.fetch,
    })
    if (options.includeContent === 'metadata-with-full-text') {
        content.fullText = await getPageFullText(rawContent, content)
    }
    const pdfMetadata = content.pdfMetadata
    const pdfPageTexts = content.pdfPageTexts
    delete content.pdfMetadata
    delete content.pdfPageTexts
    return { content, rawContent, pdfMetadata, pdfPageTexts }
}

export default analysePage
