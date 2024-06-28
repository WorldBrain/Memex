import type { PageContent } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/types'
import type { InPDFPageUIContentScriptRemoteInterface } from 'src/in-page-ui/content_script/types'
import { transformPageHTML } from '@worldbrain/memex-stemmer/lib/transform-page-html.service-worker'
import type { ExtractedPDFData } from '@worldbrain/memex-common/lib/page-indexing/types'
import type TabManagementBackground from 'src/tab-management/background'
import { runInTab } from 'src/util/webextensionRPC'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { fetchYoutubeTranscript } from 'src/util/fetch-youtube-transcript'

export interface PageAnalysis extends Partial<ExtractedPDFData> {
    content: PageContent
    favIconURI?: string
    htmlBody?: string
}

export type PageAnalyzer = (args: {
    tabId: number
    tabManagement: Pick<
        TabManagementBackground,
        'extractRawPageContent' | 'getFavIcon'
    >
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
    options.includeFavIcon = options.includeFavIcon ?? true

    let pdfMetadata: PageAnalysis['pdfMetadata']
    let pdfPageTexts: PageAnalysis['pdfPageTexts']
    if (!options.includeContent) {
        return
    }

    const ytVideoUrlPattern = /^.*(?:(?:youtu.be\/)|(?:v\/)|(?:\/u\/\w\/)|(?:embed\/)|(?:watch\?))\??(?:v=)?([^#&?]*).*/
    const [, videoId] = options.url.match(ytVideoUrlPattern) ?? []

    const rawContent = await options.tabManagement.extractRawPageContent(
        options.tabId,
    )
    if (!rawContent) {
        throw new Error(`Could extract raw page content`)
    }

    let content: PageContent | ExtractedPDFData
    if (rawContent.type === 'pdf') {
        const pdfContent = await runInTab<
            InPDFPageUIContentScriptRemoteInterface
        >(options.tabId).extractPDFContents()
        pdfMetadata = pdfContent.pdfMetadata
        pdfPageTexts = pdfContent.pdfPageTexts
        delete pdfContent.pdfMetadata
        delete pdfContent.pdfPageTexts
        content = pdfContent
    } else {
        content = {
            title: rawContent.metadata.title ?? '',
            metadata: rawContent.metadata,
            fullText: '',
        } as PageContent
    }

    if (options.includeContent === 'metadata-with-full-text') {
        content.fullText =
            rawContent.type === 'html'
                ? transformPageHTML({ html: rawContent.body }).text
                : content.fullText
    }

    if (videoId) {
        let transcriptJSON = await fetchYoutubeTranscript(videoId)

        if (transcriptJSON != null) {
            content.fullText =
                content.fullText + JSON.parse(transcriptJSON).transcriptText
        }
    }
    const favIconURI =
        options.includeFavIcon && rawContent.type !== 'pdf'
            ? await options.tabManagement.getFavIcon({ tabId: options.tabId })
            : undefined
    const htmlBody = rawContent.type === 'html' ? rawContent.body : undefined

    return {
        content,
        htmlBody,
        favIconURI,
        pdfMetadata,
        pdfPageTexts,
    }
}

export default analysePage
