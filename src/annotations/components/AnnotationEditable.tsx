import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'

import * as icons from 'src/common-ui/components/design-library/icons'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import AnnotationEdit, {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import { SidebarAnnotationTheme } from '../types'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import {
    SHARE_BUTTON_ICONS,
    SHARE_BUTTON_LABELS,
    getShareAnnotationBtnState,
    getShareAnnotationBtnAction,
} from '../sharing-utils'
import { ButtonTooltip } from 'src/common-ui/components'
import { TagsSegment } from 'src/common-ui/components/result-item-segments'

export interface AnnotationEditableGeneralProps {}

export interface AnnotationEditableProps {
    /** Required to decide how to go to an annotation when it's clicked. */
    url: string
    sharingInfo: AnnotationSharingInfo
    sharingAccess: AnnotationSharingAccess
    className?: string
    isActive?: boolean
    isHovered?: boolean
    isClickable?: boolean
    createdWhen: Date
    lastEdited: Date
    body?: string
    comment?: string
    tags: string[]
    isBookmarked?: boolean
    mode: AnnotationMode
    annotationFooterDependencies: AnnotationFooterEventProps
    annotationEditDependencies: AnnotationEditGeneralProps &
        AnnotationEditEventProps
    renderTagsPickerForAnnotation: (id: string) => JSX.Element
    renderCopyPasterForAnnotation: (id: string) => JSX.Element
    renderShareMenuForAnnotation: (id: string) => JSX.Element
}

export interface AnnotationEditableEventProps {
    onHighlightHover?: React.MouseEventHandler
    onFooterHover?: React.MouseEventHandler
    onNoteHover?: React.MouseEventHandler
    onTagsHover?: React.MouseEventHandler
    onUnhover?: React.MouseEventHandler
    onGoToAnnotation: (url: string) => void
    onMouseEnter?: (url: string) => void
    onMouseLeave?: (url: string) => void
}

export type Props = AnnotationEditableGeneralProps &
    AnnotationEditableProps &
    AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props> {
    private annotEditRef = React.createRef<AnnotationEdit>()
    private boxRef: HTMLDivElement = null
    private removeEventListeners?: () => void

    static defaultProps: Partial<Props> = {
        mode: 'default',
    }

    componentDidMount() {
        this.setupEventListeners()
    }

    componentWillUnmount() {
        if (this.boxRef && this.removeEventListeners) {
            this.removeEventListeners()
        }
    }

    focus() {
        this.annotEditRef?.current?.focusOnInputEnd()
    }

    private get sharingData() {
        const sharingProps = {
            ...this.props,
            onShare: this.props.annotationFooterDependencies.onShareClick,
            onUnshare: this.props.annotationFooterDependencies.onShareClick,
        }
        return {
            state: getShareAnnotationBtnState(sharingProps),
            action: getShareAnnotationBtnAction(sharingProps),
        }
    }

    private get creationInfo() {
        // TODO: Figure out why these dates are so unpredictable and fix it
        const handleDateData = (date: string | number | Date): number =>
            typeof date === 'number'
                ? date
                : typeof date === 'string'
                ? new Date(date).getTime()
                : date?.getTime()

        return {
            createdWhen: handleDateData(this.props.createdWhen),
            lastEdited: handleDateData(this.props.lastEdited),
        }
    }

    private get theme(): SidebarAnnotationTheme {
        return {
            cursor: this.props.isClickable ? 'pointer' : 'auto',
            hasComment: this.props.comment?.length > 0,
            hasHighlight: this.props.body?.length > 0,
            isActive: this.props.isActive,
            isEditing: this.props.mode === 'edit',
        }
    }

    private setupEventListeners = () => {
        if (this.boxRef) {
            const handleMouseEnter = () =>
                this.props.onMouseEnter?.(this.props.url)
            const handleMouseLeave = () =>
                this.props.onMouseLeave?.(this.props.url)

            this.boxRef.addEventListener('mouseenter', handleMouseEnter)
            this.boxRef.addEventListener('mouseleave', handleMouseLeave)

            this.removeEventListeners = () => {
                this.boxRef.removeEventListener('mouseenter', handleMouseEnter)
                this.boxRef.removeEventListener('mouseleave', handleMouseLeave)
            }
        }
    }

    private setBoxRef = (ref: HTMLDivElement) => {
        this.boxRef = ref
    }

    private handleGoToAnnotation = () => {
        if (!this.props.isClickable) {
            return
        }

        this.props.onGoToAnnotation(this.props.url)
    }

    private renderHighlightBody() {
        if (!this.props.body) {
            return
        }

        return (
            <HighlightStyled onMouseEnter={this.props.onHighlightHover}>
                <TextTruncated isHighlight={true} text={this.props.body} />
            </HighlightStyled>
        )
    }

    private renderNote() {
        const {
            mode,
            comment,
            annotationEditDependencies,
            annotationFooterDependencies,
        } = this.props

        if (mode === 'edit') {
            return (
                <AnnotationEdit
                    ref={this.annotEditRef}
                    {...this.props}
                    {...annotationEditDependencies}
                    rows={2}
                />
            )
        }

        if (!comment?.length) {
            return null
        }

        return (
            <CommentBox onMouseEnter={this.props.onNoteHover}>
                <TextTruncated
                    isHighlight={false}
                    text={comment}
                    onCommentEditClick={
                        annotationFooterDependencies.onEditIconClick
                    }
                />
            </CommentBox>
        )
    }

    private renderDefaultFooter() {
        const { annotationFooterDependencies: footerDeps } = this.props

        return (
            <DefaultFooterStyled>
                <ItemBoxBottom
                    firstDivProps={{ onMouseEnter: this.props.onFooterHover }}
                    creationInfo={this.creationInfo}
                    actions={[
                        {
                            key: 'delete-note-btn',
                            image: icons.trash,
                            onClick: footerDeps.onDeleteIconClick,
                            tooltipText: 'Delete Note',
                        },
                        this.props.body?.length > 0
                            ? {
                                  key: 'go-to-to-note-btn',
                                  image: icons.goTo,
                                  onClick: () =>
                                      this.props.onGoToAnnotation(
                                          this.props.url,
                                      ),
                                  tooltipText: 'Open in Page',
                              }
                            : null,
                        {
                            key: 'tag-note-btn',
                            image:
                                this.props.tags?.length > 0
                                    ? icons.tagFull
                                    : icons.tagEmpty,
                            onClick: footerDeps.onTagIconClick,
                            tooltipText: 'Tag Note',
                        },
                        {
                            key: 'copy-paste-note-btn',
                            image: icons.copy,
                            onClick: footerDeps.onCopyPasterBtnClick,
                            tooltipText: 'Copy Note',
                        },
                        {
                            key: 'share-note-btn',
                            image: SHARE_BUTTON_ICONS[this.sharingData.state],
                            onClick: footerDeps.onShareClick,
                            tooltipText:
                                SHARE_BUTTON_LABELS[this.sharingData.state],
                            isDisabled: ['sharing', 'unsharing'].includes(
                                this.sharingData.state,
                            ),
                        },
                        footerDeps.toggleBookmark && {
                            key: 'bookmark-note-btn',
                            image: this.props.isBookmarked
                                ? icons.heartFull
                                : icons.heartEmpty,
                            onClick: footerDeps.toggleBookmark,
                            tooltipText: 'Favorite Note',
                        },
                    ]}
                />
            </DefaultFooterStyled>
        )
    }

    private renderFooter() {
        const { mode, annotationFooterDependencies: footerDeps } = this.props

        let actionBtnText: string
        let actionBtnHandler: React.MouseEventHandler
        let cancelBtnHandler: React.MouseEventHandler

        if (mode === 'delete') {
            actionBtnText = 'Delete'
            actionBtnHandler = footerDeps.onDeleteConfirm
            cancelBtnHandler = footerDeps.onDeleteCancel
        } else if (mode === 'edit') {
            actionBtnText = 'Save'
            actionBtnHandler = footerDeps.onEditConfirm
            cancelBtnHandler = footerDeps.onEditCancel
        } else {
            return this.renderDefaultFooter()
        }

        return (
            <>
                {mode === 'delete' && (
                    <DeleteConfirmStyled>Really?</DeleteConfirmStyled>
                )}
                <BtnContainerStyled>
                    <ButtonTooltip tooltipText="esc" position="bottom">
                        <CancelBtnStyled onClick={cancelBtnHandler}>
                            Cancel
                        </CancelBtnStyled>
                    </ButtonTooltip>
                    <ButtonTooltip
                        tooltipText="ctrl/cmd + Enter"
                        position="bottom"
                    >
                        <ActionBtnStyled onClick={actionBtnHandler}>
                            {actionBtnText}
                        </ActionBtnStyled>
                    </ButtonTooltip>
                </BtnContainerStyled>
            </>
        )
    }

    private renderShareMenu() {
        return (
            <ShareMenuWrapper>
                {this.props.renderShareMenuForAnnotation(this.props.url)}
            </ShareMenuWrapper>
        )
    }

    private renderCopyPaster() {
        return (
            <CopyPasterWrapper>
                {this.props.renderCopyPasterForAnnotation(this.props.url)}
            </CopyPasterWrapper>
        )
    }

    private renderTagsPicker() {
        return (
            <TagPickerWrapper>
                {this.props.renderTagsPickerForAnnotation(this.props.url)}
            </TagPickerWrapper>
        )
    }

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <ItemBox firstDivProps={{ onMouseLeave: this.props.onUnhover }}>
                    <AnnotationStyled
                        id={this.props.url} // Focusing on annotation relies on this ID.
                        ref={this.setBoxRef}
                        onClick={this.handleGoToAnnotation}
                    >
                        {this.renderHighlightBody()}
                        {this.renderNote()}
                        <TagsSegment
                            tags={this.props.tags}
                            // onTagClick={this.props.onTagClick}
                            onMouseEnter={this.props.onTagsHover}
                        />
                        {this.renderFooter()}
                        {this.renderTagsPicker()}
                        {this.renderCopyPaster()}
                        {this.renderShareMenu()}
                    </AnnotationStyled>
                </ItemBox>
            </ThemeProvider>
        )
    }
}

const TagPickerWrapper = styled.div`
    position: relative;
`
const ShareMenuWrapper = styled.div`
    position: relative;
`
const CopyPasterWrapper = styled.div`
    position: relative;
    left: 70px;
`

const HighlightStyled = styled.div`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0 0 5px 0;
    padding: 10px 15px 7px 10px;
    line-height: 20px;
    text-align: left;
    line-break: normal;
`

const DefaultFooterStyled = styled.div`
    margin-left: 20px;
    margin-right: 5px;
`

const AnnotationStyled = styled.div`
    color: rgb(54, 54, 46);

    transition: background 120ms ease-in 0s;

    &:hover {
        transition: background 120ms ease-in 0s;
        background-color: rgba(55, 53, 47, 0.03);
    }

    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    padding: 10px;
    cursor: pointer;
    animation: onload 0.3s cubic-bezier(0.65, 0.05, 0.36, 1);

    cursor: ${({ theme }) => theme.cursor}
        ${({ theme }) =>
            theme.isEditing &&
            `
    background-color: white;
    cursor: default;

    &:hover {
        background-color: white;
    }
    `};
`

const DeleteConfirmStyled = styled.span`
    box-sizing: border-box;
    font-weight: 800;
    font-size: 15px;
    color: #000;
    margin-right: 5px;
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
    justify-content: space-between;
    width: 100%;
`

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

const CommentBox = styled.div`
    color: rgb(54, 54, 46);

    font-size: 14px;
    font-weight: 400;
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
    margin: 0px;
    padding: 0 15px 10px 15px;
    line-height: 1.4;
    text-align: left;

    ${({ theme }: { theme: SidebarAnnotationTheme }) =>
        !theme.hasHighlight &&
        `
        border-top: none;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        padding: 15px 15px 15px;
    `}
`
