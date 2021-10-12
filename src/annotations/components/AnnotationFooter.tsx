import * as React from 'react'

import type { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import type { AnnotationSharingAccess } from 'src/content-sharing/ui/types'

export interface Props extends AnnotationFooterEventProps {
    mode: AnnotationMode
    isEdited?: boolean
    timestamp?: string
    sharingAccess: AnnotationSharingAccess
}

export interface AnnotationFooterEventProps {
    onDeleteConfirm: React.MouseEventHandler
    onDeleteCancel: React.MouseEventHandler
    onDeleteIconClick: React.MouseEventHandler
    onEditConfirm: (shouldShare: boolean, isProtected?: boolean) => void
    onEditCancel: React.MouseEventHandler
    onEditIconClick: React.MouseEventHandler
    onTagIconClick: React.MouseEventHandler
    onShareClick: React.MouseEventHandler
    onCopyPasterBtnClick: React.MouseEventHandler
}
