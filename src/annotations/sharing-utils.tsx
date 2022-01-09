import * as icons from 'src/common-ui/components/design-library/icons'
import React from 'react'

export function getShareButtonData(
    isShared: boolean,
    isBulkShareProtected: boolean,
): { icon: string; label: React.ReactNode } {
    if (isBulkShareProtected && isShared) {
        return {
            icon: icons.sharedProtected,
            label: (
                <span>
                    Public
                    <br />& Protected
                </span>
            ),
        }
    } else if (isShared && !isBulkShareProtected) {
        return { icon: icons.webLogo, label: 'Public' }
    } else if (isBulkShareProtected && !isShared) {
        return {
            icon: icons.lock,
            label: (
                <span>
                    Private
                    <br />& Protected
                </span>
            ),
        }
    }
    return { icon: icons.link, label: 'Share' }
}
