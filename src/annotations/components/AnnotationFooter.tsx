import * as React from 'react'
import styled from 'styled-components'

import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { ButtonTooltip } from 'src/common-ui/components'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import * as icons from 'src/common-ui/components/design-library/icons'
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
    onDeleteConfirm: () => void
    onDeleteCancel: () => void
    onDeleteIconClick: () => void
    onEditConfirm: () => void
    onEditCancel: () => void
    onEditIconClick: () => void
    onShareClick: () => void
    onUnshareClick: () => void
    toggleBookmark: () => void
    onGoToAnnotation?: () => void
}

class AnnotationFooter extends React.Component<Props> {
    private renderDefaultFooter() {
        const { isEdited, timestamp, isBookmarked } = this.props

        const shareButtonState = this.getShareButtonState()
        const SHARE_BUTTON_LABELS: {
            [Key in typeof shareButtonState]: string
        } = {
            'not-shared-yet': 'Share note',
            'already-shared': 'Unshare note',
            sharing: 'Sharing note...',
            'sharing-success': 'Note shared!',
            'sharing-error': 'Could not share note :(',
            unsharing: 'Unsharing note...',
            'unsharing-success': 'Note unshared!',
            'unsharing-error': 'Could not unshare note :(',
        }

        const SHARE_BUTTON_ICONS: {
            [Key in typeof shareButtonState]: string
        } = {
            'not-shared-yet': icons.shareEmpty,
            'already-shared': icons.share,
            sharing: icons.share,
            'sharing-success': icons.share,
            'sharing-error': icons.shareEmpty,
            unsharing: icons.shareEmpty,
            'unsharing-success': icons.shareEmpty,
            'unsharing-error': icons.share,
        }

        const shareButtonLoading = shareButtonState === 'sharing' || shareButtonState === 'unsharing'

        return (
            <DefaultInnerFooterContainerStyled>
                <TimestampStyled>
                    {isEdited && <span>Last Edit: </span>}
                    {timestamp}
                </TimestampStyled>
                <DefaultFooterBtnContainerStyled>
                    <ButtonTooltip
                        position={'bottom'}
                        tooltipText={isBookmarked ? 'Un-Favorite' : 'Favorite'}
                    >
                        <IconBox onClick={this.props.toggleBookmark}>
                            <IconStyled
                                title="Toggle star"
                                src={
                                    isBookmarked
                                        ? icons.heartFull
                                        : icons.heartEmpty
                                }
                            />
                        </IconBox>
                    </ButtonTooltip>
                    <ButtonTooltip
                        position={'bottom'}
                        tooltipText={'Edit Note'}
                    >
                        <IconBox onClick={this.props.onEditIconClick}>
                            <IconStyled title="Edit note" src={icons.edit} />
                        </IconBox>
                    </ButtonTooltip>
                    <ButtonTooltip
                        position={'bottom'}
                        tooltipText={'Delete Note'}
                    >
                        <IconBox onClick={this.props.onDeleteIconClick}>
                            <IconStyled title="Delete note" src={icons.trash} />
                        </IconBox>
                    </ButtonTooltip>
                    {this.props.sharingAccess && (
                        <ButtonTooltip
                            position={'bottom'}
                            tooltipText={SHARE_BUTTON_LABELS[shareButtonState]}
                        >
                        {shareButtonLoading && (
                            <LoadingIndicator/>
                        )}
                        {!shareButtonLoading && (
                            <IconBox onClick={this.getShareButtonAction()}>
                                <IconStyled src={SHARE_BUTTON_ICONS[shareButtonState]} />
                            </IconBox>
                        )}   
                        </ButtonTooltip>
                    )}
                    {this.props.onGoToAnnotation && (
                        <ButtonTooltip
                            position={'bottom'}
                            tooltipText={'Open in Page'}
                        >
                            <IconBox onClick={this.props.onGoToAnnotation}>
                                <IconStyled
                                    title="Go to annotation"
                                    src={icons.goTo}
                                />
                            </IconBox>
                        </ButtonTooltip>
                    )}
                </DefaultFooterBtnContainerStyled>
            </DefaultInnerFooterContainerStyled>
        )
    }

    private renderEditableFooter() {
        const { mode } = this.props

        let actionBtnText: string
        let actionBtnHandler: () => void
        let cancelBtnHandler: () => void

        if (mode === 'delete') {
            actionBtnText = 'Delete'
            actionBtnHandler = this.props.onDeleteConfirm
            cancelBtnHandler = this.props.onDeleteCancel
        } else if (mode === 'edit') {
            actionBtnText = 'Save'
            actionBtnHandler = this.props.onEditConfirm
            cancelBtnHandler = this.props.onEditCancel
        } else {
            return
        }

        return (
            <InnerFooterContainerStyled>
                {mode === 'delete' && (
                    <DeleteConfirmStyled>Really?</DeleteConfirmStyled>
                )}
                <BtnContainerStyled>
                    <CancelBtnStyled onClick={cancelBtnHandler}>
                        Cancel
                    </CancelBtnStyled>
                    <ButtonTooltip
                        tooltipText="ctrl/cmd + Enter"
                        position="bottom"
                    >
                        <ActionBtnStyled onClick={actionBtnHandler}>
                            {actionBtnText}
                        </ActionBtnStyled>
                    </ButtonTooltip>
                </BtnContainerStyled>
            </InnerFooterContainerStyled>
        )
    }

    private getShareButtonState() {
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
        const info = this.props.sharingInfo ?? {
            status: 'unshared',
            taskState: 'pristine',
        }
        if (
            info.status === 'unshared' &&
            (info.taskState === 'pristine' || info.taskState === 'success')
        ) {
            return this.props.onShareClick
        }
        if (
            info.status === 'shared' &&
            (info.taskState === 'pristine' || info.taskState === 'success')
        ) {
            return this.props.onUnshareClick
        }
        return () => {}
    }

    render() {
        const { mode } = this.props

        return (
            <OuterFooterContainerStyled>
                {mode === 'default'
                    ? this.renderDefaultFooter()
                    : this.renderEditableFooter()}
            </OuterFooterContainerStyled>
        )
    }
}

export default AnnotationFooter

const ActionBtnStyled = styled.button`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;
    font-weight: 700;

    &:focus {
        background-color: grey;
    }

    &:hover {
        background-color: #e0e0e0;
    }

    &:focus {
        background-color: #79797945;
    }
`

const CancelBtnStyled = styled.button`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
    background: transparent;
    border-radius: 3px;
    color: red;

    &:hover {
        background-color: #e0e0e0;
    }

    &:focus {
        background-color: #79797945;
    }
`

const BtnContainerStyled = styled.div`
    display: flex;
    flex-direction: row-reverse;
`

const InnerFooterContainerStyled = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-left: 11px;
`

const OuterFooterContainerStyled = styled.div`
    display: flex;
    align-items: center;
    font-size: 13px;
    height: 25px;
    margin: 0 4px 4px 4px;
    box-sizing: border-box;
`

const DeleteConfirmStyled = styled.span`
    box-sizing: border-box;
    font-weight: 800;
    font-size: 15px;
    color: #000;
    margin-right: 5px;
`

const DefaultInnerFooterContainerStyled = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
`

const TimestampStyled = styled.div`
    margin-right: auto;
    margin-left: 12px;
    font-size: 12px;
    font-weight: 400;
    color: #72727f;

    & .lastEdit {
        font-weight: 600;
        color: #72727f;
        margin: 0px;
    }
`

const DefaultFooterBtnContainerStyled = styled.div`
    display: grid;
    flex-direction: row;
    margin: 0 7px 3px;
    z-index: 0;
    grid-auto-flow: column;
    display: inline-grid;
    grid-gap: 3px;
    grid-template-columns: repeat(6, 24px);
    height: 24px;
    direction: rtl;
`

const IconBox = styled.button`
    border: none;
    background: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 3px;
    display: flex;
    outline: none;
    align-items: center;
    justify-content: center;
    height: fill-available;

    &:hover {
        background-color: #e0e0e0;
    }
`
const IconStyled = styled.img`
    border: none;
    z-index: 2500;
    outline: none;
    border-radius: 3px;
    width: 100%;
    height: 100%;
    opacity: 0.6;
`
