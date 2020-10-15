import { ReadwiseHighlight } from './api'

export type ReadwiseAction = ReadwisePostHighlightsAction
export interface ReadwisePostHighlightsAction {
    type: 'post-highlights'
    highlights: ReadwiseHighlight[]
}
