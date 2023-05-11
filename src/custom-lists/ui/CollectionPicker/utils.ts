import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { SpacePickerState, SpaceDisplayEntry } from './logic'

export const getEntriesForCurrentTab = (
    state: SpacePickerState,
): SpaceDisplayEntry[] =>
    state.currentTab === 'page-links'
        ? normalizedStateToArray(state.pageLinkEntries)
        : normalizedStateToArray(state.listEntries)
