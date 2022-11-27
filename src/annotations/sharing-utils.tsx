import * as icons from 'src/common-ui/components/design-library/icons'
import React from 'react'

export function getShareButtonData(
    isShared: boolean,
    isBulkShareProtected: boolean,
    hasSharedLists: boolean,
): { icon: string; label: React.ReactNode } {
    if (!isShared && hasSharedLists) {
        return {
            icon: icons.peopleFine,
            label: 'Shared',
        }
    }
    if (isShared && isBulkShareProtected) {
        return {
            icon: icons.lock,
            label: 'Public',
        }
    } else if (isShared && !isBulkShareProtected) {
        return { icon: icons.globe, label: 'Public' }
    } else if (!isShared && isBulkShareProtected) {
        return {
            icon: icons.lock,
            label: 'Private',
        }
    }
    return { icon: icons.personFine, label: 'Private' }
}
