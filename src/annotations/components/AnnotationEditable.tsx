import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom, {
    ItemBoxBottomAction,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

import * as icons from 'src/common-ui/components/design-library/icons'
import type { AnnotationMode } from 'src/sidebar/annotations-sidebar/types'
import type { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import AnnotationEdit, {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
import TextTruncated from 'src/annotations/components/parts/TextTruncated'
import SaveBtn from 'src/annotations/components/save-btn'
import type { SidebarAnnotationTheme, ListDetailsGetter } from '../types'
import { ButtonTooltip } from 'src/common-ui/components'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import TagsSegment from 'src/common-ui/components/result-item-tags-segment'
import Margin from 'src/dashboard-refactor/components/Margin'
import type { NoteResultHoverState } from './types'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { getShareButtonData } from '../sharing-utils'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { ClickAway } from 'src/util/click-away-wrapper'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import ListsSegment from 'src/common-ui/components/result-item-spaces-segment'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

export interface HighlightProps extends AnnotationProps {
    body: string
    comment?: string
}
export interface NoteProps extends AnnotationProps {
    body?: string
    comment: string
}

export interface AnnotationProps {
    zIndex?: number
    tags: string[]
    lists: number[]
    createdWhen: Date | number
    mode: AnnotationMode
    hoverState: NoteResultHoverState
    /** Required to decide how to go to an annotation when it's clicked. */
    url?: string
    className?: string
    isActive?: boolean
    isShared: boolean
    hasReplies?: boolean
    appendRepliesToggle?: boolean
    isBulkShareProtected: boolean
    repliesLoadingState?: UITaskState
    onReplyBtnClick?: React.MouseEventHandler
    isClickable?: boolean
    contextLocation?: string
    lastEdited?: Date | number
    annotationFooterDependencies?: AnnotationFooterEventProps
    annotationEditDependencies?: AnnotationEditGeneralProps &
        AnnotationEditEventProps
    creatorDependencies?: {
        name: string
        profileImgSrc?: string
    }
    onHighlightClick?: React.MouseEventHandler
    onGoToAnnotation?: React.MouseEventHandler
    getListDetailsById: ListDetailsGetter
    onTagClick?: (tag: string) => void
    renderTagsPickerForAnnotation?: (id: string) => JSX.Element
    renderListsPickerForAnnotation?: (id: string) => JSX.Element
    renderCopyPasterForAnnotation?: (id: string) => JSX.Element
    renderShareMenuForAnnotation?: (id: string) => JSX.Element
}

export interface AnnotationEditableEventProps {
    onHighlightHover?: React.MouseEventHandler
    onFooterHover?: React.MouseEventHandler
    onNoteHover?: React.MouseEventHandler
    onTagsHover?: React.MouseEventHandler
    onListsHover?: React.MouseEventHandler
    onUnhover?: React.MouseEventHandler
}

interface State {
    editorHeight: string
    showQuickTutorial: boolean
}

export type Props = (HighlightProps | NoteProps) & AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props> {
    private annotEditRef = React.createRef<AnnotationEdit>()

    static MOD_KEY = getKeyName({ key: 'mod' })
    static defaultProps: Pick<
        Props,
        'mode' | 'hoverState' | 'tags' | 'lists'
    > = {
        tags: [],
        lists: [],
        mode: 'default',
        hoverState: null,
    }

    state: State = {
        editorHeight: '50px',
        showQuickTutorial: false,
    }

    focusEditForm() {
        this.annotEditRef?.current?.focusEditor()
    }

    componentDidMount() {
        this.textAreaHeight()
    }

    private get displayLists(): Array<{
        id: number
        name: string
        isShared: boolean
    }> {
        return this.props.lists.map((id) => ({
            id,
            ...this.props.getListDetailsById(id),
        }))
    }

    private get hasSharedLists(): boolean {
        return this.displayLists.some((list) => list.isShared)
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
        const lastEdited = handleDateData(
            this.props.lastEdited ?? this.props.createdWhen,
        )

        return {
            createdWhen,
            lastEdited: lastEdited !== createdWhen ? lastEdited : undefined,
            creator: this.props.creatorDependencies
                ? {
                      displayName: this.props.creatorDependencies.name,
                  }
                : undefined,
        }
    }

    private toggleShowTutorial() {
        this.setState({ showQuickTutorial: !this.state.showQuickTutorial })
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
        const {
            annotationFooterDependencies: footerDeps,
            onGoToAnnotation,
        } = this.props

        const actionsBox =
            this.props.hoverState === 'main-content' ? (
                <HighlightActionsBox>
                    {onGoToAnnotation && (
                        <ButtonTooltip
                            tooltipText="Open in Page"
                            position="bottom"
                        >
                            <HighlightAction right="2px">
                                <Icon
                                    onClick={onGoToAnnotation}
                                    filePath={icons.goTo}
                                    heightAndWidth={'16px'}
                                />
                            </HighlightAction>
                        </ButtonTooltip>
                    )}
                    {footerDeps?.onEditIconClick && (
                        <ButtonTooltip
                            tooltipText={
                                <span>
                                    <strong>Add/Edit Note</strong>
                                    <br />
                                    or double-click card
                                </span>
                            }
                            position="leftBig"
                        >
                            <HighlightAction>
                                <Icon
                                    onClick={footerDeps.onEditIconClick}
                                    icon={'edit'}
                                    heightAndWidth={'16px'}
                                    padding={'5px'}
                                />
                            </HighlightAction>
                        </ButtonTooltip>
                    )}
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

    private textAreaHeight() {
        let lines = 1

        try {
            lines = this.props.comment.split(/\r\n|\r|\n/).length
        } catch {
            lines = 1
        }

        const height = lines * 20
        const heightinPX = (height + 'px').toString()
        this.setState({ editorHeight: heightinPX })
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
                    {...annotationEditDependencies}
                    rows={2}
                    editorHeight={this.state.editorHeight}
                    isShared={this.props.isShared}
                    isBulkShareProtected={this.props.isBulkShareProtected}
                />
            )
        }

        if (!comment?.length) {
            return null
        }

        return (
            <CommentBox onMouseEnter={this.props.onNoteHover}>
                {annotationFooterDependencies?.onEditIconClick && (
                    <EditNoteIconBox tooltipText="Edit Note" position="bottom">
                        <ButtonTooltip
                            tooltipText="Edit Note"
                            position="bottom"
                        >
                            <Icon
                                onClick={
                                    annotationFooterDependencies?.onEditIconClick
                                }
                                icon={'edit'}
                                heightAndWidth={'16px'}
                                padding={'5px'}
                            />
                        </ButtonTooltip>
                    </EditNoteIconBox>
                )}
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
        const {
            annotationFooterDependencies: footerDeps,
            isBulkShareProtected,
            repliesLoadingState,
            appendRepliesToggle,
            onReplyBtnClick,
            hoverState,
            hasReplies,
            isShared,
        } = this.props

        const repliesToggle: ItemBoxBottomAction =
            repliesLoadingState === 'running'
                ? { node: <LoadingIndicator size={16} /> }
                : {
                      key: 'replies-btn',
                      onClick: onReplyBtnClick,
                      tooltipText: 'Toggle replies',
                      tooltipPosition: 'left',
                      image: hasReplies
                          ? icons.commentFull
                          : icons.commentEmpty,
                  }

        if (!footerDeps) {
            return [repliesToggle]
        }

        const shareIconData = getShareButtonData(
            isShared,
            isBulkShareProtected,
            this.hasSharedLists,
        )

        if (hoverState === null) {
            if (appendRepliesToggle) {
                return [repliesToggle]
            }

            if (isShared || isBulkShareProtected) {
                return [
                    {
                        key: 'share-note-btn',
                        isDisabled: true,
                        image: shareIconData.icon,
                    },
                ]
            }

            return [
                {
                    key: 'share-note-btn',
                    isDisabled: true,
                    image: shareIconData.icon,
                },
            ]
        }

        if (hoverState === 'footer') {
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
                    key: 'share-note-btn',
                    image: shareIconData.icon,
                    onClick: footerDeps.onShareClick,
                    tooltipText: shareIconData.label,
                },
                appendRepliesToggle && repliesToggle,
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
                key: 'share-note-btn',
                isDisabled: true,
                image: shareIconData.icon,
            },
            appendRepliesToggle && repliesToggle,
        ]
    }

    private renderMarkdownHelpButton() {
        return (
            <MarkdownButtonContainer
                onClick={() => this.setState({ showQuickTutorial: true })}
            >
                Formatting Help
                <MarkdownButton
                    src={icons.helpIcon}
                    onClick={() => this.setState({ showQuickTutorial: true })}
                />
            </MarkdownButtonContainer>
        )
    }

    private renderFooter() {
        const {
            mode,
            isShared,
            isBulkShareProtected,
            annotationEditDependencies: editDeps,
            annotationFooterDependencies: footerDeps,
        } = this.props

        let confirmBtn: JSX.Element
        let cancelBtnHandler: React.MouseEventHandler

        if (mode === 'default' || footerDeps == null) {
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

        if (mode === 'delete') {
            cancelBtnHandler = footerDeps.onDeleteCancel
            confirmBtn = (
                <ActionBtnStyled onClick={footerDeps.onDeleteConfirm}>
                    Delete
                </ActionBtnStyled>
            )
        } else {
            cancelBtnHandler = editDeps.onEditCancel
            confirmBtn = (
                <SaveBtn
                    onSave={editDeps.onEditConfirm(false)}
                    hasSharedLists={this.hasSharedLists}
                    isProtected={isBulkShareProtected}
                    isShared={isShared}
                />
            )
        }

        return (
            <DeletionBox>
                {mode === 'delete' && (
                    <DeleteConfirmStyled>Really?</DeleteConfirmStyled>
                )}
                <SaveActionBar>
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
                            {confirmBtn}
                        </ButtonTooltip>
                    </BtnContainerStyled>
                    {this.renderMarkdownHelpButton()}
                </SaveActionBar>
            </DeletionBox>
        )
    }

    render() {
        const { annotationFooterDependencies } = this.props

        return (
            <ThemeProvider theme={this.theme}>
                <AnnotationBox
                    zIndex={this.props.zIndex}
                    top="5px"
                    bottom="2px"
                >
                    <ItemBox
                        firstDivProps={{
                            id: this.props.url,
                            onMouseLeave: this.props.onUnhover,
                        }}
                    >
                        <AnnotationStyled>
                            <ContentContainer
                                onDoubleClick={
                                    annotationFooterDependencies?.onEditIconClick
                                }
                            >
                                {this.renderHighlightBody()}
                                {this.renderNote()}
                            </ContentContainer>
                            {/* lists */}
                            {/* Collections button for annotations. To be added later. */}

                            {this.props.renderListsPickerForAnnotation && (
                                <ListsSegment
                                    lists={this.displayLists}
                                    onMouseEnter={this.props.onListsHover}
                                    showEditBtn={
                                        this.props.hoverState === 'lists'
                                    }
                                    onListClick={undefined}
                                    onEditBtnClick={
                                        this.props.annotationFooterDependencies
                                            ?.onListIconClick
                                    }
                                    renderSpacePicker={() =>
                                        this.props.renderListsPickerForAnnotation(
                                            this.props.url,
                                        )
                                    }
                                />
                            )}

                            {/* tags */}
                            {this.props.renderTagsPickerForAnnotation && (
                                <TagsSegment
                                    tags={this.props.tags}
                                    onMouseEnter={this.props.onTagsHover}
                                    showEditBtn={
                                        this.props.hoverState === 'tags'
                                    }
                                    onTagClick={this.props.onTagClick}
                                    onEditBtnClick={
                                        this.props.annotationFooterDependencies
                                            ?.onTagIconClick
                                    }
                                />
                            )}
                            {this.renderFooter()}
                            {this.props.renderTagsPickerForAnnotation && (
                                <TagPickerWrapper>
                                    <HoverBox left="0px" padding={'px'}>
                                        {this.props.renderTagsPickerForAnnotation(
                                            this.props.url,
                                        )}
                                    </HoverBox>
                                </TagPickerWrapper>
                            )}
                            {this.props.renderCopyPasterForAnnotation && (
                                <CopyPasterWrapper>
                                    {this.props.renderCopyPasterForAnnotation(
                                        this.props.url,
                                    )}
                                </CopyPasterWrapper>
                            )}
                            {this.props.renderShareMenuForAnnotation && (
                                <ShareMenuWrapper>
                                    {this.props.renderShareMenuForAnnotation(
                                        this.props.url,
                                    )}
                                </ShareMenuWrapper>
                            )}
                        </AnnotationStyled>
                    </ItemBox>
                </AnnotationBox>
                {this.state.showQuickTutorial && (
                    <ClickAway
                        onClickAway={() =>
                            this.setState({ showQuickTutorial: false })
                        }
                    >
                        <HoverBox
                            top={
                                this.props.contextLocation === 'dashboard'
                                    ? 'unset'
                                    : '215px'
                            }
                            bottom={
                                this.props.contextLocation === 'dashboard'
                                    ? '60px'
                                    : 'unset'
                            }
                            right={
                                this.props.contextLocation === 'dashboard'
                                    ? '20px'
                                    : '50px'
                            }
                            width="430px"
                            position={
                                this.props.contextLocation === 'dashboard'
                                    ? 'fixed'
                                    : 'initial'
                            }
                            height="430px"
                            overflow="scroll"
                        >
                            <QuickTutorial
                                markdownHelpOnTop={true}
                                getKeyboardShortcutsState={
                                    getKeyboardShortcutsState
                                }
                            />
                        </HoverBox>
                    </ClickAway>
                )}
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
    position: absolute;
    justify-content: center;
    align-items: center;
    z-index: 100;
    border: none;
    outline: none;
    background: white;
    width: 20px;
    height: 20px;
    padding: 4px;
    margin-top: -5px;
    border-radius: 3px;
    border: 1px solid #f0f0f0;

    &:hover {
        background-color: #f0f0f0;
    }
`

const AnnotationBox = styled(Margin)<{ zIndex: number }>`
    width: 99%;
    align-self: center;
    z-index: ${(props) => props.zIndex};
`

const EditNoteIcon = styled.div`
    display: flex;
    border: none;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    background-color: ${(props) => props.theme.colors.primary};
    mask-image: url(${icons.commentEditFull});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
    cursor: pointer;
`
const MarkdownButtonContainer = styled.div`
    display: flex;
    font-size: 12px;
    color: ${(props) => props.theme.colors.lighterText};
    align-items: center;
    cursor: pointer;
`

const MarkdownButton = styled.img`
    display: flex;
    height: 16px;
    opacity: 0.8;
    mask-position: center center;
    margin-left: 10px;
    cursor: pointer;
`

const SaveActionBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`

const HighlightActionsBox = styled.div`
    position: absolute;
    right: 0px;
    top: -5px;
    width: 50px;
    display: flex;
    justify-content: flex-end;
    z-index: 10000;
`

const NoteTextBox = styled.div`
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow-x: hidden;
    line-height: 20px;
    line-break: normal;
    word-break: break-word;
    hyphens: none;
    width: 100%;
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
    border-radius: 3px;
    padding: 2px;
    border: 1px solid #f0f0f0;

    &:hover {
        background-color: #f0f0f0;
    }
`

const HighlightTextBox = styled.div`
    position: relative;
`

const AddNoteIcon = styled.button`
    border: none;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    background-color: ${(props) => props.theme.colors.primary};
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
    background-color: ${(props) => props.theme.colors.primary};
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
    border-radius: 3px;
    background-color: ${(props) => props.theme.colors.backgroundHighlight};
    color: ${(props) => props.theme.colors.darkerText};
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
    padding: 15px 15px 15px 15px;
    line-height: 1.4;
    text-align: left;
    border-top: 1px solid #f0f0f0;
    overflow: visible;
    flex-direction: row-reverse;
    display: flex;

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

const DefaultFooterStyled = styled.div`
    display: flex;
    border-top: 1px solid #f0f0f0;

    & div {
        border-top: none;
    }
`

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
        outline: 2px solid #5671cfb8;
    `};
`

const ContentContainer = styled.div`
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
`

const DeleteConfirmStyled = styled.span`
    box-sizing: border-box;
    font-weight: 800;
    font-size: 14px;
    color: #000;
    margin-right: 10px;
    text-align: right;
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
        background-color: ${(props) => props.theme.colors.backgroundColor};
    }

    &:focus {
        background-color: #79797945;
    }
`

const BtnContainerStyled = styled.div`
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-end;
    align-items: center;
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
    border: 1px solid #f0f0f0;

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
    align-items: center;
    border-top: 1px solid #f0f0f0;
    padding: 5px 15px 5px 15px;
`
