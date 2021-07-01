import type { ReadwiseHighlight } from '@worldbrain/memex-common/lib/readwise-integration/api/types'

export type ReadwiseAction = ReadwisePostHighlightsAction
export interface ReadwisePostHighlightsAction {
    type: 'post-highlights'
    highlights: ReadwiseHighlight[]
}
