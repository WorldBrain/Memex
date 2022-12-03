import * as icons from 'src/common-ui/components/design-library/icons'
import React from 'react'
import { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'

export function getShareButtonData(
    isShared: boolean,
    isBulkShareProtected: boolean,
    hasSharedLists: boolean,
): { icon: IconKeys; label: React.ReactNode } {
    if (!isShared && hasSharedLists) {
        return {
            icon: 'peopleFine',
            label: 'Shared',
        }
    }
    if (isShared && isBulkShareProtected) {
        return {
            icon: 'lock',
            label: 'Public',
        }
    } else if (isShared && !isBulkShareProtected) {
        return { icon: 'globe', label: 'Public' }
    } else if (!isShared && isBulkShareProtected) {
        return {
            icon: 'lock',
            label: 'Private',
        }
    }
    return { icon: 'personFine', label: 'Private' }
}
