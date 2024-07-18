import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { SpacePickerDependencies, SpacePickerState } from './types'

export const getEntriesForCurrentPickerTab = (
    props: SpacePickerDependencies,
    state: SpacePickerState,
): UnifiedList[] =>
    state.currentTab === 'page-links'
        ? normalizedStateToArray(state.pageLinkEntries).filter((e) => {
              if (props.normalizedPageUrlToFilterPageLinksBy) {
                  return (
                      e.normalizedPageUrl ===
                      props.normalizedPageUrlToFilterPageLinksBy
                  )
              }
              return true
          })
        : normalizedStateToArray(state.listEntries)
