import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom, {
    ItemBoxBottomAction,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'

import * as icons from 'src/common-ui/components/design-library/icons'
import { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import AnnotationEdit, {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import { SidebarAnnotationTheme, AnnotationPrivacyLevels } from '../types'
import {
    AnnotationSharingInfo,
    AnnotationSharingAccess,
} from 'src/content-sharing/ui/types'
import {
    SHARE_BUTTON_LABELS,
    getShareButtonIcon,
    getShareAnnotationBtnState,
    getShareAnnotationBtnAction,
} from '../sharing-utils'
import { ButtonTooltip } from 'src/common-ui/components'
import TagsSegment from 'src/common-ui/components/result-item-tags-segment'
import Margin from 'src/dashboard-refactor/components/Margin'
import { NoteResultHoverState } from 'src/dashboard-refactor/search-results/types'
import { getKeyName } from 'src/util/os-specific-key-names'

export interface AnnotationEditableProps {
    /** Required to decide how to go to an annotation when it's clicked. */
    url: string
    sharingInfo?: AnnotationSharingInfo
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
    hoverState: NoteResultHoverState
    annotationFooterDependencies: AnnotationFooterEventProps
    annotationEditDependencies: AnnotationEditGeneralProps &
        AnnotationEditEventProps
    onTagClick?: (tag: string) => void
    onHighlightClick: React.MouseEventHandler
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
}

export type Props = AnnotationEditableProps & AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props> {
    private annotEditRef = React.createRef<AnnotationEdit>()

    static MOD_KEY = getKeyName({ key: 'mod' })
    static defaultProps: Partial<Props> = {
        mode: 'default',
        hoverState: null,
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

        const createdWhen = handleDateData(this.props.createdWhen)
        const lastEdited = handleDateData(this.props.lastEdited)

        return {
            createdWhen,
            lastEdited: lastEdited !== createdWhen ? lastEdited : undefined,
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

    private renderHighlightBody() {
        if (!this.props.body) {
            return
        }

        const { annotationFooterDependencies: footerDeps } = this.props

        const actionsBox =
            this.props.hoverState === 'main-content' ? (
                <HighlightActionsBox>
                    {footerDeps.onGoToAnnotation && (
                        <ButtonTooltip
                            tooltipText="Open in Page"
                            position="bottom"
                        >
                            <HighlightAction right="2px">
                                <GoToHighlightIcon
                                    onClick={footerDeps.onGoToAnnotation}
                                />
                            </HighlightAction>
                        </ButtonTooltip>
                    )}
                    <ButtonTooltip
                        tooltipText="Add/Edit Note"
                        position="bottom"
                    >
                        <HighlightAction>
                            <AddNoteIcon onClick={footerDeps.onEditIconClick} />
                        </HighlightAction>
                    </ButtonTooltip>
                </HighlightActionsBox>
            ) : null

        return (
            <HighlightStyled
                onMouseEnter={this.props.onHighlightHover}
                onClick={
                    this.props.isClickable
                        ? this.props.onHighlightClick
                        : undefined
                }
            >
                <ActionBox>{actionsBox}</ActionBox>
                <TextTruncated text={this.props.body}>
                    {({ text }) => (
                        <HighlightTextBox>
                            <HighlightText>{text}</HighlightText>
                        </HighlightTextBox>
                    )}
                </TextTruncated>
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
                <EditNoteIconBox tooltipText="Edit Note" position="bottom">
                    <ButtonTooltip tooltipText="Edit Note" position="bottom">
                        <EditNoteIcon
                            onClick={
                                annotationFooterDependencies.onEditIconClick
                            }
                        />
                    </ButtonTooltip>
                </EditNoteIconBox>
                <TextTruncated text={comment}>
                    {({ text }) => (
                        <NoteTextBox>
                            <NoteText>{text}</NoteText>
                        </NoteTextBox>
                    )}
                </TextTruncated>
            </CommentBox>
        )
    }

    private calcFooterActions(): ItemBoxBottomAction[] {
        const { annotationFooterDependencies: footerDeps } = this.props

        if (this.props.hoverState === null) {
            return ['already-shared', 'sharing-success'].includes(
                this.sharingData.state,
            ) ||
                this.props.sharingInfo?.privacyLevel ===
                    AnnotationPrivacyLevels.PROTECTED
                ? [
                      {
                          key: 'share-note-btn',
                          isDisabled: true,
                          image: getShareButtonIcon(
                              this.sharingData.state,
                              this.props.sharingInfo?.privacyLevel,
                          ),
                      },
                  ]
                : []
        }

        if (this.props.hoverState === 'footer') {
            return [
                {
                    key: 'delete-note-btn',
                    image: icons.trash,
                    onClick: footerDeps.onDeleteIconClick,
                    tooltipText: 'Delete Note',
                },
                {
                    key: 'copy-paste-note-btn',
                    image: icons.copy,
                    onClick: footerDeps.onCopyPasterBtnClick,
                    tooltipText: 'Copy Note',
                },
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
                    key: 'share-note-btn',
                    image: getShareButtonIcon(
                        this.sharingData.state,
                        this.props.sharingInfo?.privacyLevel,
                    ),
                    onClick: footerDeps.onShareClick,
                    tooltipText: SHARE_BUTTON_LABELS[this.sharingData.state],
                    isDisabled: ['sharing', 'unsharing'].includes(
                        this.sharingData.state,
                    ),
                },
            ]
        }

        return [
            {
                key: 'delete-note-btn',
                isDisabled: true,
                image: icons.trash,
            },
            {
                key: 'copy-paste-note-btn',
                isDisabled: true,
                image: icons.copy,
            },
            {
                key: 'tag-note-btn',
                isDisabled: true,
                image:
                    this.props.tags?.length > 0
                        ? icons.tagFull
                        : icons.tagEmpty,
            },
            {
                key: 'share-note-btn',
                isDisabled: true,
                image: getShareButtonIcon(
                    this.sharingData.state,
                    this.props.sharingInfo?.privacyLevel,
                ),
            },
        ]
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
            return (
                <DefaultFooterStyled>
                    <ItemBoxBottom
                        firstDivProps={{
                            onMouseEnter: this.props.onFooterHover,
                        }}
                        creationInfo={this.creationInfo}
                        actions={this.calcFooterActions()}
                    />
                </DefaultFooterStyled>
            )
        }

        return (
            <DeletionBox>
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
                        tooltipText={`${AnnotationEditable.MOD_KEY} + Enter`}
                        position="bottom"
                    >
                        <ActionBtnStyled onClick={actionBtnHandler}>
                            {actionBtnText}
                        </ActionBtnStyled>
                    </ButtonTooltip>
                </BtnContainerStyled>
            </DeletionBox>
        )
    }

    render() {
        return (
            <ThemeProvider theme={this.theme}>
                <Margin top="10px">
                    <ItemBox
                        firstDivProps={{
                            id: this.props.url,
                            onMouseLeave: this.props.onUnhover,
                        }}
                    >
                        <AnnotationStyled>
                            {this.renderHighlightBody()}
                            {this.renderNote()}
                            <TagsSegment
                                tags={this.props.tags}
                                onMouseEnter={this.props.onTagsHover}
                                showEditBtn={this.props.hoverState === 'tags'}
                                onTagClick={this.props.onTagClick}
                                onEditBtnClick={
                                    this.props.annotationFooterDependencies
                                        .onTagIconClick
                                }
                            />
                            {this.renderFooter()}
                            <TagPickerWrapper>
                                {this.props.renderTagsPickerForAnnotation(
                                    this.props.url,
                                )}
                            </TagPickerWrapper>
                            <CopyPasterWrapper>
                                {this.props.renderCopyPasterForAnnotation(
                                    this.props.url,
                                )}
                            </CopyPasterWrapper>
                            <ShareMenuWrapper>
                                {this.props.renderShareMenuForAnnotation(
                                    this.props.url,
                                )}
                            </ShareMenuWrapper>
                        </AnnotationStyled>
                    </ItemBox>
                </Margin>
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

const EditNoteIconBox = styled.div`
    display: none;
    position: relative;
    justify-content: flex-end;
    top: 0px;
    right: 0px;
    float: right;
    z-index: 1;
    border: none;
    outline: none;
    float: right;
`

const EditNoteIcon = styled.div`
    display: flex;
    border: none;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    background-color: #3a2f45;
    mask-image: url(${icons.commentEditFull});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
`

const HighlightActionsBox = styled.div`
    position: absolute;
    right: 0px;
    top: 0px;
    width: 50px;
    display: flex;
    justify-content: flex-end;
`

const NoteTextBox = styled.div`
    position: relative;
    min-height: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow-x: hidden;
    line-height: 22px;
    line-break: normal;
    word-break: break-word;
    hyphens: auto;

    & *:first-child {
        margin-top: 0px;
    }

    & *:last-child {
        margin-bottom: 0px;
    }
`

const NoteText = styled(Markdown)`
    display: block;
    width: 100%;
`

const ActionBox = styled.div`
    position: relative;
    z-index: 1;
`

const HighlightAction = styled(Margin)`
    display: flex;
    background-color: white;
    border-radius: 5px;
    padding: 2px;
`

const HighlightTextBox = styled.div`
    position: relative;
`

const AddNoteIcon = styled.button`
    border: none;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    background-color: #3a2f45;
    mask-image: url(${icons.plus});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
`

const GoToHighlightIcon = styled.button`
    border: none;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    background-color: #3a2f45;
    mask-image: url(${icons.goTo});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
`

const HighlightText = styled.span`
    box-decoration-break: clone;
    overflow: hidden;
    line-height: 25px;
    font-style: normal;
    background-color: #d4e8ff;
    color: #3a2f45;
    padding: 2px 5px;
`

const HighlightStyled = styled.div`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0;
    padding: 10px 15px 7px 10px;
    line-height: 20px;
    text-align: left;
    line-break: normal;
`

const CommentBox = styled.div`
    color: rgb(54, 54, 46);
    font-size: 14px;
    font-weight: 400;
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
    margin: 0px;
    padding: 10px 15px 10px 15px;
    line-height: 1.4;
    text-align: left;
    border-top: 1px solid #e0e0e0;

    &: hover ${EditNoteIconBox} {
        display: flex;
    }

    ${({ theme }: { theme: SidebarAnnotationTheme }) =>
        !theme.hasHighlight &&
        `
        border-top: none;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    `}
`

const DefaultFooterStyled = styled.div``

const AnnotationStyled = styled.div`
    color: rgb(54, 54, 46);

    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    cursor: pointer;
    animation: onload 0.3s cubic-bezier(0.65, 0.05, 0.36, 1);
    border-radius: inherit;

    cursor: ${({ theme }) => theme.cursor}
        ${({ theme }) =>
            theme.isEditing &&
            `
        background-color: white;
        cursor: default;
    `};

    ${({ theme }) =>
        theme.isActive &&
        `
        box-shadow: 0px 0px 5px 1px #00000080;
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
    width: 100%;
    justify-content: flex-end;
    padding: 0 5px 5px;
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

const DeletionBox = styled.div`
    display: flex;
    justify-content: space-between;
    padding-left: 10px;
`
