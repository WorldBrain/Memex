import * as React from 'react'

import * as icons from 'src/common-ui/components/design-library/icons'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'

export interface Props {
    sharingAccess: AnnotationSharingAccess
    sharingInfo?: AnnotationSharingInfo
    onShare: () => void
    onUnshare: () => void
    renderShareIcon: (props: {
        onClickAction: () => void
        isDisabled: boolean
        isLoading: boolean
        tooltipText: string
        imgSrc: string
    }) => JSX.Element
}

export class AnnotationShareIconRenderer extends React.Component<Props> {
    private getShareButtonState() {
        if (this.props.sharingAccess === 'feature-disabled') {
            return 'feature-disabled'
        }
        if (this.props.sharingAccess === 'page-not-shared') {
            return 'page-not-shared'
        }

        const info = this.props.sharingInfo ?? {
            status: 'unshared',
            taskState: 'pristine',
        }
        if (info.status === 'shared') {
            if (info.taskState === 'pristine') {
                return 'already-shared'
            }
            if (info.taskState === 'running') {
                return 'sharing'
            }
            if (info.taskState === 'success') {
                return 'sharing-success'
            }
            if (info.taskState === 'error') {
                return 'sharing-error'
            }
        }
        if (info.status === 'unshared') {
            if (info.taskState === 'running') {
                return 'unsharing'
            }
            if (info.taskState === 'success') {
                return 'unsharing-success'
            }
            if (info.taskState === 'error') {
                return 'unsharing-error'
            }
        }
        return 'not-shared-yet'
    }

    private getShareButtonAction() {
        if (this.props.sharingAccess !== 'sharing-allowed') {
            return () => {}
        }

        const info = this.props.sharingInfo ?? {
            status: 'unshared',
            taskState: 'pristine',
        }
        if (
            info.status === 'unshared' &&
            (info.taskState === 'pristine' || info.taskState === 'success')
        ) {
            return this.props.onShare
        }
        if (
            info.status === 'shared' &&
            (info.taskState === 'pristine' || info.taskState === 'success')
        ) {
            return this.props.onUnshare
        }
        return () => {}
    }

    render() {
        if (this.props.sharingAccess === 'feature-disabled') {
            return null
        }

        const shareButtonState = this.getShareButtonState()
        const SHARE_BUTTON_LABELS: {
            [Key in typeof shareButtonState]: string
        } = {
            'feature-disabled': '',
            'page-not-shared': 'Please add this page to a shared list first',
            'not-shared-yet': 'Share note',
            'already-shared': 'Unshare note',
            sharing: 'Sharing note...',
            'sharing-success': 'Note shared',
            'sharing-error': 'Error Sharing Note',
            unsharing: 'Unsharing note',
            'unsharing-success': 'Note unshared!',
            'unsharing-error': 'Error Sharing Note',
        }

        const SHARE_BUTTON_ICONS: {
            [Key in typeof shareButtonState]: string | null
        } = {
            'feature-disabled': '',
            'page-not-shared': icons.shareEmpty,
            'not-shared-yet': icons.shareEmpty,
            'already-shared': icons.share,
            sharing: icons.share,
            'sharing-success': icons.share,
            'sharing-error': icons.shareEmpty,
            unsharing: icons.shareEmpty,
            'unsharing-success': icons.shareEmpty,
            'unsharing-error': icons.share,
        }

        return this.props.renderShareIcon({
            onClickAction: this.getShareButtonAction(),
            imgSrc: SHARE_BUTTON_ICONS[shareButtonState],
            tooltipText: SHARE_BUTTON_LABELS[shareButtonState],
            isDisabled: this.props.sharingAccess === 'page-not-shared',
            isLoading:
                shareButtonState === 'sharing' ||
                shareButtonState === 'unsharing',
        })
    }
}
