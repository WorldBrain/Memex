import * as React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
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
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Margin from 'src/dashboard-refactor/components/Margin'
import type { NoteResultHoverState } from './types'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { getShareButtonData } from '../sharing-utils'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import ListsSegment from 'src/common-ui/components/result-item-spaces-segment'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type { ListPickerShowState } from 'src/dashboard-refactor/search-results/types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'

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
    activeShareMenuNoteId?: string
    isShared: boolean
    shareButtonRef?: React.RefObject<HTMLDivElement>
    spacePickerButtonRef?: React.RefObject<HTMLDivElement>
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
    renderListsPickerForAnnotation?: (id: string) => JSX.Element
    renderCopyPasterForAnnotation?: (id: string) => JSX.Element
    renderShareMenuForAnnotation?: (id: string) => JSX.Element
    getYoutubePlayer?(): YoutubePlayer
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
    showSpacePicker: ListPickerShowState
    showShareMenu: boolean
    showCopyPaster: boolean
    hoverEditArea: boolean
    hoverCard: boolean
}

export type Props = (HighlightProps | NoteProps) & AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props, State> {
    private annotEditRef = React.createRef<AnnotationEdit>()
    private spacePickerBarRef = React.createRef<HTMLDivElement>()
    private shareButtonRef = React.createRef<HTMLDivElement>()
    private tutorialButtonRef = React.createRef<HTMLElement>()
    private copyPasterButtonRef = React.createRef<HTMLDivElement>()

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
        showSpacePicker: 'hide',
        showShareMenu: false,
        showCopyPaster: false,
        hoverEditArea: false,
        hoverCard: false,
    }

    focusEditForm() {
        this.annotEditRef?.current?.focusEditor()
    }

    componentDidMount() {
        this.textAreaHeight()
    }

    private updateSpacePickerState(showState: ListPickerShowState) {
        if (this.state.showSpacePicker === 'hide') {
            this.setState({
                showSpacePicker: showState,
            })
        } else {
            this.setState({
                showSpacePicker: 'hide',
            })
        }
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
            this.props.mode != 'edit' && this.state.hoverCard === true ? (
                <HighlightActionsBox>
                    {onGoToAnnotation && (
                        <TooltipBox
                            tooltipText="Open in Page"
                            placement="bottom"
                        >
                            <Icon
                                onClick={onGoToAnnotation}
                                filePath={'goTo'}
                                heightAndWidth={'18px'}
                                borderColor={'lightHover'}
                                background={'backgroundColorDarker'}
                            />
                        </TooltipBox>
                    )}
                    <TooltipBox
                        tooltipText={
                            <span>
                                <strong>Add/Edit Note</strong>
                                <br />
                                or double-click card
                            </span>
                        }
                        placement="bottom"
                    >
                        <Icon
                            onClick={footerDeps.onEditIconClick}
                            icon={'edit'}
                            heightAndWidth={'18px'}
                            borderColor={'lightHover'}
                            background={'backgroundColorDarker'}
                        />
                    </TooltipBox>
                </HighlightActionsBox>
            ) : null

        return (
            <HighlightStyled
                onClick={
                    this.props.isClickable
                        ? this.props.onHighlightClick
                        : undefined
                }
                hasComment={this.props.comment.length > 0}
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
                <AnnotationEditContainer hasHighlight={this.theme.hasHighlight}>
                    <AnnotationEdit
                        ref={this.annotEditRef}
                        {...annotationEditDependencies}
                        rows={2}
                        editorHeight={this.state.editorHeight}
                        isShared={this.props.isShared}
                        isBulkShareProtected={this.props.isBulkShareProtected}
                        getYoutubePlayer={this.props.getYoutubePlayer}
                    />
                </AnnotationEditContainer>
            )
        }

        if (!comment?.length) {
            return null
        }

        return (
            <CommentBox>
                {!this.theme.hasHighlight && this.state.hoverCard === true && (
                    <TooltipBox tooltipText="Edit Note" placement="bottom">
                        <Icon
                            onClick={
                                annotationFooterDependencies?.onEditIconClick
                            }
                            icon={'edit'}
                            heightAndWidth={'20px'}
                            padding={'5px'}
                        />
                    </TooltipBox>
                )}
                <TextTruncated text={comment}>
                    {({ text }) => (
                        <NoteTextBox hasHighlight={this.theme.hasHighlight}>
                            <NoteText
                                contextLocation={this.props.contextLocation}
                                getYoutubePlayer={this.props.getYoutubePlayer}
                            >
                                {text}
                            </NoteText>
                        </NoteTextBox>
                    )}
                </TextTruncated>
            </CommentBox>
        )
    }

    private isAnyModalOpen() {
        if (
            this.state.showCopyPaster ||
            this.state.showQuickTutorial ||
            this.state.showShareMenu ||
            this.state.showSpacePicker !== 'hide'
        ) {
            return true
        } else {
            return false
        }
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
            repliesLoadingState === 'success'
                ? {
                      key: 'replies-btn',
                      onClick: onReplyBtnClick,
                      tooltipText: 'Show replies',
                      imageColor: 'purple',
                      image: hasReplies ? 'commentFull' : 'commentEmpty',
                  }
                : { node: <LoadingIndicator size={16} /> }

        if (!footerDeps) {
            return [repliesToggle]
        }

        if (this.state.hoverCard === false) {
            if (appendRepliesToggle) {
                return [repliesToggle]
            }
        }

        if (this.state.hoverCard === true || this.isAnyModalOpen() === true) {
            return [
                {
                    key: 'delete-note-btn',
                    image: 'trash',
                    onClick: footerDeps.onDeleteIconClick,
                    tooltipText: 'Delete Note',
                },
                {
                    key: 'copy-paste-note-btn',
                    image: 'copy',
                    onClick: () => this.setState({ showCopyPaster: true }),
                    tooltipText: 'Copy Note',
                    active: this.state.showCopyPaster,
                    buttonRef: this.copyPasterButtonRef,
                },
                {
                    key: 'add-spaces-btn',
                    image: 'plus',
                    imageColor: 'purple',
                    tooltipText: 'Add Note to Spaces',
                    onClick: () => this.updateSpacePickerState('footer'),
                    buttonRef: this.props.spacePickerButtonRef,
                    active: this.state.showSpacePicker === 'footer',
                },
                // {
                //     key: 'share-note-btn',
                //     image: shareIconData.icon,
                //     onClick: footerDeps.onShareClick,
                //     tooltipText: shareIconData.label,
                // },
                appendRepliesToggle && repliesToggle,
            ]
        }

        return [
            {
                key: 'add-spaces-btn',
                image: 'plus',
                imageColor: 'purple',
                // onClick: () => this.updateSpacePickerState('footer'),
                // buttonRef: this.props.spacePickerButtonRef,
                // active: this.state.showSpacePicker === 'footer',
            },
            appendRepliesToggle && repliesToggle,
        ]
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

        const shareIconData = getShareButtonData(
            isShared,
            isBulkShareProtected,
            this.hasSharedLists,
        )

        if (mode === 'default' || footerDeps == null) {
            return (
                <DefaultFooterStyled>
                    <PrimaryAction
                        onClick={() =>
                            this.setState({
                                showShareMenu: true,
                            })
                        }
                        label={shareIconData.label}
                        icon={shareIconData.icon}
                        size={'small'}
                        type={'tertiary'}
                        innerRef={this.shareButtonRef}
                        active={this.state.showShareMenu}
                    />
                    <ItemBoxBottom
                        borderTop={false}
                        creationInfo={this.creationInfo}
                        actions={this.calcFooterActions()}
                    />
                    {this.state.showSpacePicker === 'footer' &&
                        this.renderSpacePicker(this.props.spacePickerButtonRef)}
                    {this.state.showShareMenu &&
                        this.renderShareMenu(this.shareButtonRef)}
                </DefaultFooterStyled>
            )
        }

        if (mode === 'delete') {
            cancelBtnHandler = footerDeps.onDeleteCancel
            confirmBtn = (
                <ActionBtnStyled onClick={footerDeps.onDeleteConfirm}>
                    Delete
                    <Icon
                        filePath={icons.check}
                        color={'purple'}
                        heightAndWidth={'20px'}
                        hoverOff
                    />
                </ActionBtnStyled>
            )
        } else {
            cancelBtnHandler = editDeps.onEditCancel
            confirmBtn = (
                <TooltipBox
                    tooltipText={`${AnnotationEditable.MOD_KEY} + Enter`}
                    placement="bottom"
                >
                    <SaveBtn
                        onSave={editDeps.onEditConfirm(false)}
                        hasSharedLists={this.hasSharedLists}
                        isProtected={isBulkShareProtected}
                        isShared={isShared}
                        tabIndex={0}
                    />
                </TooltipBox>
            )
        }

        return (
            <DefaultFooterStyled>
                <PrimaryAction
                    onClick={footerDeps.onShareClick}
                    label={shareIconData.label}
                    icon={shareIconData.icon}
                    size={'small'}
                    type={'tertiary'}
                    innerRef={this.shareButtonRef}
                    active={this.props.activeShareMenuNoteId && true}
                />

                <DeletionBox>
                    {mode === 'delete' && (
                        <DeleteConfirmStyled>Really?</DeleteConfirmStyled>
                    )}
                    <SaveActionBar>
                        <BtnContainerStyled>
                            <Icon
                                onClick={cancelBtnHandler}
                                icon={icons.removeX}
                                color={'normalText'}
                                heightAndWidth="18px"
                            />
                            {confirmBtn}
                        </BtnContainerStyled>
                    </SaveActionBar>
                </DeletionBox>
            </DefaultFooterStyled>
        )
    }

    private renderSpacePicker(referenceElement: React.RefObject<HTMLElement>) {
        if (
            !(
                this.state.showSpacePicker === 'lists-bar' ||
                this.state.showSpacePicker === 'footer'
            )
        ) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={referenceElement.current}
                placement={
                    this.state.showSpacePicker === 'lists-bar'
                        ? 'bottom'
                        : 'bottom-end'
                }
                closeComponent={() => {
                    this.setState({
                        showSpacePicker: 'hide',
                    })
                }}
                offsetX={10}
            >
                {this.props.renderListsPickerForAnnotation(this.props.url)}
            </PopoutBox>
        )
    }

    renderShareMenu(referenceElement: React.RefObject<HTMLElement>) {
        if (!this.state.showShareMenu) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={referenceElement.current}
                placement={'bottom-start'}
                closeComponent={() => {
                    this.setState({
                        showShareMenu: false,
                    })
                }}
                offsetX={10}
            >
                {this.props.renderShareMenuForAnnotation(this.props.url)}
            </PopoutBox>
        )
    }

    renderCopyPaster(referenceElement: React.RefObject<HTMLElement>) {
        if (!this.state.showCopyPaster) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={referenceElement.current}
                placement={'bottom-end'}
                closeComponent={() => {
                    this.setState({
                        showCopyPaster: false,
                    })
                }}
                offsetX={10}
            >
                {this.props.renderCopyPasterForAnnotation(this.props.url)}
            </PopoutBox>
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
                    onMouseEnter={() =>
                        this.setState({
                            hoverCard: true,
                        })
                    }
                    onMouseOver={() =>
                        this.setState({
                            hoverCard: true,
                        })
                    }
                    onMouseLeave={() =>
                        this.setState({
                            hoverCard: false,
                        })
                    }
                >
                    <ItemBox
                        firstDivProps={{
                            id: this.props.url,
                        }}
                    >
                        <AnnotationStyled>
                            <ContentContainer
                                onDoubleClick={
                                    annotationFooterDependencies?.onEditIconClick
                                }
                                isEditMode={this.props.mode === 'edit'}
                            >
                                {this.renderHighlightBody()}
                                {this.renderNote()}
                            </ContentContainer>
                            {(this.props.lists.length > 0 ||
                                this.props.mode === 'edit') && (
                                <ListsSegment
                                    tabIndex={0}
                                    lists={this.displayLists}
                                    onEditBtnClick={() =>
                                        this.updateSpacePickerState('lists-bar')
                                    }
                                    spacePickerButtonRef={
                                        this.spacePickerBarRef
                                    }
                                    padding={
                                        this.props.mode === 'edit'
                                            ? '10px 15px 10px 15px'
                                            : '0px 15px 10px 15px'
                                    }
                                />
                            )}
                            {this.renderFooter()}
                        </AnnotationStyled>
                        {this.state.showSpacePicker === 'lists-bar' &&
                            this.renderSpacePicker(this.spacePickerBarRef)}
                        {this.renderCopyPaster(this.copyPasterButtonRef)}
                    </ItemBox>
                </AnnotationBox>
                {this.state.showQuickTutorial && (
                    <PopoutBox
                        targetElementRef={this.tutorialButtonRef.current}
                        placement={'bottom'}
                        closeComponent={() => this.toggleShowTutorial()}
                    >
                        <QuickTutorial
                            markdownHelpOnTop={true}
                            getKeyboardShortcutsState={
                                getKeyboardShortcutsState
                            }
                        />
                    </PopoutBox>
                )}
            </ThemeProvider>
        )
    }
}

const AnnotationEditContainer = styled.div<{ hasHighlight: boolean }>`
    margin-top: ${(props) => !props.hasHighlight && '10px'};
`

const AnnotationBox = styled(Margin)<{ zIndex: number }>`
    width: 100%;
    align-self: center;
    z-index: ${(props) => props.zIndex};
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
    display: flex;
    justify-content: flex-end;
    z-index: 10000;
    top: -4px;
    grid-gap: 5px;
`

const NoteTextBox = styled.div<{ hasHighlight: boolean }>`
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
    padding: 5px 0;

    ${(props) =>
        props.hasHighlight &&
        css`
            margin-top: -10px;
        `}
`

const NoteText = styled(Markdown)`
    display: block;
    width: 100%;
`

const ActionBox = styled.div`
    position: relative;
    z-index: 1;
`

const HighlightTextBox = styled.div`
    position: relative;
`

const HighlightText = styled.span`
    box-decoration-break: clone;
    overflow: hidden;
    line-height: 25px;
    font-style: normal;
    border-radius: 3px;
    background-color: ${(props) => props.theme.colors.highlightColorDefault};
    color: ${(props) => props.theme.colors.black};
    padding: 2px 5px;
`

const HighlightStyled = styled.div<{ hasComment: boolean }>`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0;
    padding: 15px 15px 7px 15px;
    line-height: 20px;
    text-align: left;
    line-break: normal;

    ${(props) =>
        !props.hasComment &&
        css`
            padding: 15px 15px 15px 15px;
        `}
`

const CommentBox = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 300;
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
    margin: 0px;
    padding: 10px 20px 10px;
    line-height: 1.4;
    text-align: left;
    //border-top: 1px solid ${(props) => props.theme.colors.lineGrey};
    overflow: visible;
    flex-direction: row-reverse;
    display: flex;

    /* &:first-child {
        padding: 15px 20px 20px;
    } */

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
    align-items: center;
    padding-left: 15px;
    justify-content: space-between;
    border-top: 1px solid ${(props) => props.theme.colors.lightHover};
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

const ContentContainer = styled.div<{ isEditMode: boolean }>`
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    z-index: 1001;

    ${(props) =>
        props.isEditMode &&
        css`
            /* margin-bottom: 10px; */
        `}
`

const DeleteConfirmStyled = styled.span`
    box-sizing: border-box;
    font-weight: 800;
    font-size: 14px;
    color: ${(props) => props.theme.colors.normalText};
    margin-right: 10px;
    text-align: right;
`

const BtnContainerStyled = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    grid-gap: 10px;
`

const ActionBtnStyled = styled.button`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 0px 5px 0px 10px;
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;
    font-weight: 400;
    border: 1px solid ${(props) => props.theme.colors.lineGrey};
    color: ${(props) => props.theme.colors.normalText};
    display: flex;
    justify-content: center;
    align-items: center;
    grid-gap: 5px;

    & * {
        cursor: pointer;
    }
`

const DeletionBox = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f0f0f0;
    padding: 5px 5px 5px 15px;
`
