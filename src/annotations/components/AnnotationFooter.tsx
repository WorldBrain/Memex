import * as React from 'react'
import styled from 'styled-components'

import { ButtonTooltip } from 'src/common-ui/components'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'

export interface Props extends AnnotationFooterEventProps {
    mode: AnnotationMode
    isEdited?: boolean
    timestamp?: string
    hasBookmark?: boolean
}

export interface AnnotationFooterEventProps {
    onDeleteConfirm: () => void
    onDeleteCancel: () => void
    onDeleteIconClick: () => void
    onEditConfirm: () => void
    onEditCancel: () => void
    onEditIconClick: () => void
    toggleBookmark: () => void
    onGoToAnnotation?: () => void
}

class AnnotationFooter extends React.Component<Props> {
    private renderDefaultFooter() {
        const bookmarkBtnProps = {
            title: 'Toggle star',
            onClick: (e) => {
                e.stopPropagation()
                this.props.toggleBookmark()
            },
        }

        return (
            <DefaultInnerFooterContainerStyled>
                <TimestampStyled>
                    {this.props.isEdited && <span>Last Edit: </span>}
                    {this.props.timestamp}
                </TimestampStyled>
                <DefaultFooterBtnContainerStyled>
                    <TrashBtnStyled
                        title="Delete note"
                        onClick={this.props.onDeleteIconClick}
                    />
                    {this.props.onGoToAnnotation && (
                        <GoToPageBtnStyled
                            title="Go to annotation"
                            onClick={this.props.onGoToAnnotation}
                        />
                    )}
                    <EditBtnStyled
                        title="Edit note"
                        onClick={this.props.onEditIconClick}
                    />
                    {this.props.hasBookmark ? (
                        <BookmarkedBtnStyled {...bookmarkBtnProps} />
                    ) : (
                        <NotBookmarkedBtnStyled {...bookmarkBtnProps} />
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
                    <ButtonTooltip
                        tooltipText="ctrl/cmd + Enter"
                        position="top"
                    >
                        <ActionBtnStyled onClick={actionBtnHandler}>
                            {actionBtnText}
                        </ActionBtnStyled>
                    </ButtonTooltip>
                    <CancelBtnStyled onClick={cancelBtnHandler}>
                        Cancel
                    </CancelBtnStyled>
                </BtnContainerStyled>
            </InnerFooterContainerStyled>
        )
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
    padding: 3px 8px 3px 8px;
    border-radius: radius3;
    font-weight: 500;

    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    font-weight: 700;
    outline: none;
    background: none;

    &:focus {
        background-color: #e8e8e8;
    }

    &:hover {
        background-color: #e8e8e8;
        color: rgb(54, 54, 46);
    }
`

const CancelBtnStyled = styled.button`
    padding: 3px 8px 3px 8px;
    border-radius: radius3;
    font-weight: 500;

    color: #f29d9d;

    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    margin-right: -6px;
    background: transparent;

    &:focus {
        background-color: #e8e8e8;
    }

    &:hover {
        background-color: #e8e8e8;
        color: rgb(54, 54, 46);
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
    display: flex;
    flex-direction: row;
    margin: 0 7px 3px;
    z-index: 0;
`

const CommonBtnStyled = styled.button`
    border: none;
    z-index: 2500;
    min-width: 20px;
    height: 16px;
    background-repeat: no-repeat;
    cursor: pointer;
    outline: none;
    background-position: center center;
    border-radius: 3px;
    background-size: contain;
    max-width: 30px;
    width: stretch;
    margin-left: 4px;
    opacity: 0.3;
`

const TrashBtnStyled = styled(CommonBtnStyled)`
    background-image: url('/img/trash.svg');

    &:hover {
        opacity: 0.6;
    }
`

const EditBtnStyled = styled(CommonBtnStyled)`
    background-image: url('/img/comment_edit.svg');

    &:hover {
        opacity: 0.6;
    }
`

const GoToPageBtnStyled = styled(CommonBtnStyled)`
    background-image: url('/img/open.svg');

    &:hover {
        opacity: 0.6;
    }
`

const BookmarkedBtnStyled = styled(CommonBtnStyled)`
    background-image: url('/img/star_full.svg');
    opacity: 1;
`

const NotBookmarkedBtnStyled = styled(CommonBtnStyled)`
    background-image: url('/img/star_empty.svg');

    &:hover {
        opacity: 0.6;
    }
`
