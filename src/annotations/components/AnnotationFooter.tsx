import * as React from 'react'

import type { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import type {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import type { AnnotationPrivacyLevels } from '../types'

export interface Props extends AnnotationFooterEventProps {
    mode: AnnotationMode
    isEdited?: boolean
    timestamp?: string
    sharingAccess: AnnotationSharingAccess
    sharingInfo?: AnnotationSharingInfo
}

export interface AnnotationFooterEventProps {
    onDeleteConfirm: React.MouseEventHandler
    onDeleteCancel: React.MouseEventHandler
    onDeleteIconClick: React.MouseEventHandler
    onEditConfirm: (privacyLevel: AnnotationPrivacyLevels) => void
    onEditCancel: React.MouseEventHandler
    onEditIconClick: React.MouseEventHandler
    onTagIconClick: React.MouseEventHandler
    onShareClick: React.MouseEventHandler
    onCopyPasterBtnClick: React.MouseEventHandler
}
