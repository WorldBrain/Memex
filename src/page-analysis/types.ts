import type { RawPageContent } from '@worldbrain/memex-common/lib/page-indexing/content-extraction/types'

export interface PageAnalyzerInterface {
    extractRawPageContent: () => Promise<RawPageContent>
}
