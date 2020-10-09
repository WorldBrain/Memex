import extractPageMetadataFromRawContent, {
    getPageFullText,
} from './content-extraction'
import { PageContent } from 'src/search'
import TabManagementBackground from 'src/tab-management/background'

export interface PageAnalysis {
    content: PageContent
    favIconURI?: string
}

export type PageAnalyzer = (args: {
    tabId: number
    tabManagement: Pick<
        TabManagementBackground,
        'extractRawPageContent' | 'getFavIcon'
    >
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

    const content = await extractPageContent(options)
    const favIconURI = options.includeFavIcon
        ? await options.tabManagement.getFavIcon({ tabId })
        : undefined

    return {
        content,
        favIconURI,
    }
}

async function extractPageContent(options: {
    tabId: number
    tabManagement: Pick<TabManagementBackground, 'extractRawPageContent'>
    includeContent?: 'metadata-only' | 'metadata-with-full-text'
}): Promise<PageContent | undefined> {
    if (!options.includeContent) {
        return
    }

    const rawContent = await options.tabManagement.extractRawPageContent(
        options.tabId,
    )
    if (!rawContent) {
        throw new Error(`Could extract raw page content`)
    }

    const content = await extractPageMetadataFromRawContent(rawContent)
    if (options.includeContent === 'metadata-with-full-text') {
        content.fullText = await getPageFullText(rawContent, content)
    }
    return content
}

export default analysePage
