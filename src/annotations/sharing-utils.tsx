import * as icons from 'src/common-ui/components/design-library/icons'
import React from 'react'

// TODO: Properly differentiate all 4 cases
export function getShareButtonData(
    isShared: boolean,
    isBulkShareProtected: boolean,
): { icon: string; label: any } {
    if (isBulkShareProtected && isShared) {
        return { icon: icons.sharedProtected, label: <span>Note Shared<br/>& Protected</span> }
    } else if (isShared && !isBulkShareProtected) {
        return { icon: icons.shared, label: 'Note Shared' }
    } else if (isBulkShareProtected && !isShared) {
        return { icon: icons.lock, label: <span>Note Private<br/>& Protected</span> }
    }
    return { icon: icons.person, label: 'Share Note' }
}
