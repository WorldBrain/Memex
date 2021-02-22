import * as React from 'react'

import {
    SharingProps,
    SHARE_BUTTON_ICONS,
    SHARE_BUTTON_LABELS,
    getShareAnnotationBtnAction,
    getShareAnnotationBtnState,
} from 'src/annotations/sharing-utils'

export interface Props extends SharingProps {
    renderShareIcon: (props: {
        onClickAction: React.MouseEventHandler
        isDisabled: boolean
        isLoading: boolean
        tooltipText: string
        imgSrc: string
    }) => JSX.Element
}

export class AnnotationShareIconRenderer extends React.Component<Props> {
    render() {
        const shareButtonState = getShareAnnotationBtnState(this.props)

        return this.props.renderShareIcon({
            onClickAction: getShareAnnotationBtnAction(this.props),
            imgSrc: SHARE_BUTTON_ICONS[shareButtonState],
            tooltipText: SHARE_BUTTON_LABELS[shareButtonState],
            isDisabled: this.props.sharingAccess === 'feature-disabled',
            isLoading:
                shareButtonState === 'sharing' ||
                shareButtonState === 'unsharing',
        })
    }
}
