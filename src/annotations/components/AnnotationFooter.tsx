import * as React from 'react'

export interface AnnotationFooterEventProps {
    onDeleteConfirm: React.MouseEventHandler
    onDeleteCancel: React.MouseEventHandler
    onDeleteIconClick: React.MouseEventHandler
    onEditIconClick: React.MouseEventHandler
    onEditHighlightIconClick: React.MouseEventHandler
    onShareClick: React.MouseEventHandler
    onCopyPasterBtnClick: React.MouseEventHandler
    onCopyPasterDefaultExecute: () => void
}
