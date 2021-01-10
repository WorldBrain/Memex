import * as React from 'react'

import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'

export interface Props extends AnnotationFooterEventProps {
    mode: AnnotationMode
    isEdited?: boolean
    timestamp?: string
    isBookmarked?: boolean
    sharingAccess: AnnotationSharingAccess
    sharingInfo?: AnnotationSharingInfo
}

export interface AnnotationFooterEventProps {
    onDeleteConfirm: React.MouseEventHandler
    onDeleteCancel: React.MouseEventHandler
    onDeleteIconClick: React.MouseEventHandler
    onEditConfirm: React.MouseEventHandler
    onEditCancel: React.MouseEventHandler
    onEditIconClick: React.MouseEventHandler
    onTagIconClick: React.MouseEventHandler
    onShareClick: React.MouseEventHandler
    onUnshareClick: React.MouseEventHandler
    toggleBookmark: React.MouseEventHandler
    onGoToAnnotation?: React.MouseEventHandler
    onCopyPasterBtnClick: React.MouseEventHandler
}
