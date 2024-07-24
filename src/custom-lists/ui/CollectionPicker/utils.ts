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

export const generateRenderedListEntryId = (
    entry: Pick<UnifiedList, 'unifiedId'>,
    treeNodeEntry?: Pick<UnifiedList, 'unifiedId'>,
): string =>
    !treeNodeEntry
        ? entry.unifiedId
        : `${RENDERED_ID_TREE_NODE_PREFIX}-${entry.unifiedId}-${treeNodeEntry.unifiedId}`

export const isRenderedListEntryIdForTreeNode = (renderedId: string): boolean =>
    renderedId.startsWith(RENDERED_ID_TREE_NODE_PREFIX)

export const extractUnifiedIdsFromRenderedId = (
    renderedId: string,
): { baseUnifiedId: string; treeNodeUnifiedId?: string } => {
    if (!isRenderedListEntryIdForTreeNode(renderedId)) {
        return { baseUnifiedId: renderedId }
    }
    let matchResult = renderedId.match(
        new RegExp(`^${RENDERED_ID_TREE_NODE_PREFIX}-(\\d+)-(\\d+)$`),
    )
    if (!matchResult || (!matchResult[1] && !matchResult[2])) {
        throw new Error(
            `Failed to extract unified ID from rendered ID for space picker entry: ${renderedId}`,
        )
    }
    return {
        baseUnifiedId: matchResult[1],
        treeNodeUnifiedId: matchResult[2],
    }
}

const RENDERED_ID_TREE_NODE_PREFIX = 'tree-node'
