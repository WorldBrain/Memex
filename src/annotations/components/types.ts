import { ResultHoverState } from 'src/dashboard-refactor/search-results/types'

export interface FocusableComponent {
    focus(): void
}

export type NoteResultHoverState = ResultHoverState | 'note'
