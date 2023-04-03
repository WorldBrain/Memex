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
    url?: string
}) => Promise<PageAnalysis>

/**
 * Performs page content analysis on a given Tab's ID.
 *
 * CONTEXT: This needs to be called on a tab that is ready to be indexed.
 */
const analysePage: PageAnalyzer = async (options) => {
    const { tabId, url } = options
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
    url?: string
}): Promise<
    | {
          content: PageContent
          rawContent: RawPageContent
          pdfMetadata?: PageAnalysis['pdfMetadata']
          pdfPageTexts?: PageAnalysis['pdfPageTexts']
      }
    | undefined
> {
    let content
    let rawContent
    let pdfMetadata
    let pdfPageTexts

    if (!options.includeContent) {
        return
    }

    const ytVideoUrlPattern = /^.*(?:(?:youtu.be\/)|(?:v\/)|(?:\/u\/\w\/)|(?:embed\/)|(?:watch\?))\??(?:v=)?([^#&?]*).*/
    const [, videoId] = options.url.match(ytVideoUrlPattern) ?? []

    rawContent = await options.tabManagement.extractRawPageContent(
        options.tabId,
    )
    if (!rawContent) {
        throw new Error(`Could extract raw page content`)
    }

    content = await extractPageMetadataFromRawContent(rawContent, options)

    if (options.includeContent === 'metadata-with-full-text') {
        content.fullText = await getPageFullText(rawContent, content)
    }
    pdfMetadata = content.pdfMetadata
    pdfPageTexts = content.pdfPageTexts
    delete content.pdfMetadata
    delete content.pdfPageTexts

    if (videoId) {
        const isStaging =
            process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
            process.env.NODE_ENV === 'development'

        const baseUrl = isStaging
            ? 'https://cloudflare-memex-staging.memex.workers.dev'
            : 'https://cloudfare-memex.memex.workers.dev'

        const normalisedYoutubeURL =
            'https://www.youtube.com/watch?v=' + videoId

        const response = await fetch(baseUrl + '/youtube-transcripts', {
            method: 'POST',
            body: JSON.stringify({
                originalUrl: normalisedYoutubeURL,
            }),
            headers: { 'Content-Type': 'application/json' },
        })

        let responseContent = await response.text()

        let transcriptText = JSON.parse(responseContent).transcriptText

        if (transcriptText != null) {
            content.fullText =
                content.fullText + JSON.parse(responseContent).transcriptText
        }
    }
    return { content, rawContent, pdfMetadata, pdfPageTexts }
}

export default analysePage
