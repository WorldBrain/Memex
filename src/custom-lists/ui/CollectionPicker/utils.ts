import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { SpacePickerState } from './types'

export const getEntriesForCurrentPickerTab = (
    state: SpacePickerState,
): UnifiedList[] =>
    state.currentTab === 'page-links'
        ? normalizedStateToArray(state.pageLinkEntries)
        : normalizedStateToArray(state.listEntries)
