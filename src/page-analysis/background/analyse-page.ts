import getFavIcon from './get-fav-icon'
import extractPageMetadataFromRawContent, {
    getPageFullText,
} from './content-extraction'
import { PageContent } from 'src/search'
import TabManagementBackground from 'src/tab-management/background'

export interface PageAnalysis {
    content: PageContent
    favIconURI?: string
    fullText?: string
}

export type PageAnalyzer = (args: {
    tabId: number
    tabManagement: Pick<TabManagementBackground, 'extractRawPageContent'>
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
        ? await getFavIcon({ tabId })
        : undefined

    return {
        content: content?.metadata,
        fullText: content?.fullText,
        favIconURI,
    }
}

type Extraction = { metadata: PageContent; fullText?: string }
async function extractPageContent(options: {
    tabId: number
    tabManagement: Pick<TabManagementBackground, 'extractRawPageContent'>
    includeContent?: 'metadata-only' | 'metadata-with-full-text'
}): Promise<Extraction | undefined> {
    if (!options.includeContent) {
        return
    }

    const rawContent = await options.tabManagement.extractRawPageContent(
        options.tabId,
    )
    if (!rawContent) {
        throw new Error(`Could extract raw page content`)
    }

    const metadata = await extractPageMetadataFromRawContent(rawContent)
    let fullText: string
    if (options.includeContent === 'metadata-with-full-text') {
        fullText = await getPageFullText(rawContent, metadata)
    }
    return { metadata, fullText }
}

export default analysePage
