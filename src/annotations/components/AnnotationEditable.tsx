import * as React from 'react'
import styled, { ThemeProvider, css } from 'styled-components'
import ItemBox from '@worldbrain/memex-common/lib/common-ui/components/item-box'
import ItemBoxBottom, {
    ItemBoxBottomAction,
} from '@worldbrain/memex-common/lib/common-ui/components/item-box-bottom'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

import * as icons from 'src/common-ui/components/design-library/icons'
import type { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import AnnotationEdit, {
    AnnotationEditGeneralProps,
    AnnotationEditEventProps,
} from 'src/annotations/components/AnnotationEdit'
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
import SpacePicker from 'src/custom-lists/ui/CollectionPicker'
import type { UnifiedAnnotation } from '../cache/types'
import type { AnnotationCardInstanceLocation } from 'src/sidebar/annotations-sidebar/types'
import { ANNOT_BOX_ID_PREFIX } from 'src/sidebar/annotations-sidebar/constants'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import { truncateText } from 'src/annotations/utils'

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
    isEditing?: boolean
    isDeleting?: boolean
    initShowSpacePicker?: ListPickerShowState
    hoverState: NoteResultHoverState
    /** Required to decide how to go to an annotation when it's clicked. */
    unifiedId: string
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
    listPickerRenderLocation?: ListPickerShowState
    onListClick?: (unifiedListId: number) => void
    onHighlightClick?: React.MouseEventHandler
    onGoToAnnotation?: React.MouseEventHandler
    getListDetailsById: ListDetailsGetter
    renderListsPickerForAnnotation?: (
        unifiedId: UnifiedAnnotation['unifiedId'],
    ) => JSX.Element
    renderCopyPasterForAnnotation?: (
        unifiedId: UnifiedAnnotation['unifiedId'],
    ) => JSX.Element
    renderShareMenuForAnnotation?: (
        unifiedId: UnifiedAnnotation['unifiedId'],
    ) => JSX.Element
    getYoutubePlayer?(): YoutubePlayer
    pageUrl?: string
    creatorId?: string | number
    currentUserId?: string | number
    selectedListId?: number
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
    isTruncatedNote?: boolean
    isTruncatedHighlight?: boolean
    truncatedTextHighlight: string
    truncatedTextComment: string
    needsTruncation?: boolean
}

export type Props = (HighlightProps | NoteProps) & AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props, State> {
    private annotEditRef = React.createRef<AnnotationEdit>()
    private spacePickerBarRef = React.createRef<HTMLDivElement>()
    private shareButtonRef = React.createRef<HTMLDivElement>()
    private tutorialButtonRef = React.createRef<HTMLElement>()
    private copyPasterButtonRef = React.createRef<HTMLDivElement>()

    static MOD_KEY = getKeyName({ key: 'mod' })
    static defaultProps: Pick<Props, 'hoverState' | 'tags' | 'lists'> = {
        tags: [],
        lists: [],
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
        isTruncatedNote: false,
        isTruncatedHighlight: false,
        truncatedTextHighlight: '',
        truncatedTextComment: '',
        needsTruncation: false,
    }

    focusEditForm() {
        this.annotEditRef?.current?.focusEditor()
    }

    componentDidMount() {
        this.setTextAreaHeight()

        let needsTruncation: boolean

        if (this.props.comment?.length || this.props.body?.length) {
            if (
                truncateText(this.props?.comment)['isTooLong'] ||
                truncateText(this.props?.body)['isTooLong']
            ) {
                needsTruncation = true
            }
        }

        if (this.props.comment) {
            this.setState({
                isTruncatedNote:
                    truncateText(this.props?.comment)['isTooLong'] ?? false,
                truncatedTextComment:
                    truncateText(this.props?.comment)['text'] ?? '',
            })
        }

        if (this.props.body) {
            this.setState({
                isTruncatedHighlight:
                    truncateText(this.props?.body)['isTooLong'] ?? false,
                truncatedTextHighlight:
                    truncateText(this.props?.body)['text'] ?? '',
            })
        }

        if (this.props?.body || this.props?.comment) {
            this.setState({
                needsTruncation:
                    truncateText(this.props?.comment)['isTooLong'] ||
                    truncateText(this.props?.body)['isTooLong']
                        ? true
                        : false,
            })
        }
    }

    // This is a hack to ensure this state, which isn't available on init, only gets set once
    private hasInitShowSpacePickerChanged = false
    componentDidUpdate(prevProps: Readonly<Props>) {
        if (
            !this.hasInitShowSpacePickerChanged &&
            this.props.initShowSpacePicker !== prevProps.initShowSpacePicker
        ) {
            this.hasInitShowSpacePickerChanged = true
            this.setState({ showSpacePicker: this.props.initShowSpacePicker })
        }
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
        name: string | JSX.Element
        isShared: boolean
    }> {
        return this.props.lists
            .filter((list) => list !== this.props.selectedListId)
            .map((id) => ({
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
            isEditing: this.props.isEditing,
            isActive: this.props.isActive,
        }
    }

    private toggleTextTruncation() {
        if (this.state.isTruncatedHighlight || this.state.isTruncatedNote) {
            this.setState({
                isTruncatedNote: false,
                isTruncatedHighlight: false,
            })
        } else {
            this.setState({
                isTruncatedNote: true,
                isTruncatedHighlight: true,
            })
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
            !this.props.isEditing && this.state.hoverCard ? (
                <HighlightActionsBox>
                    {this.state.needsTruncation && (
                        <TooltipBox
                            tooltipText={
                                this.state.isTruncatedHighlight ||
                                this.state.isTruncatedNote
                                    ? 'Expand Note'
                                    : 'Show Less'
                            }
                            placement="bottom"
                        >
                            <Icon
                                onClick={() => this.toggleTextTruncation()}
                                filePath={
                                    this.state.isTruncatedHighlight ||
                                    this.state.isTruncatedNote
                                        ? 'expand'
                                        : 'compress'
                                }
                                heightAndWidth={'18px'}
                                borderColor={'greyScale3'}
                                background={'greyScale1'}
                            />
                        </TooltipBox>
                    )}
                    {onGoToAnnotation && (
                        <TooltipBox
                            tooltipText="Open in Page"
                            placement="bottom"
                        >
                            <Icon
                                onClick={onGoToAnnotation}
                                filePath={'goTo'}
                                heightAndWidth={'18px'}
                                borderColor={'greyScale3'}
                                background={'greyScale1'}
                            />
                        </TooltipBox>
                    )}
                    {footerDeps?.onEditIconClick &&
                    this.props.currentUserId === this.props.creatorId ? (
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
                                borderColor={'greyScale3'}
                                background={'greyScale1'}
                            />
                        </TooltipBox>
                    ) : undefined}
                </HighlightActionsBox>
            ) : null
        return (
            <HighlightStyled
                onClick={
                    this.props.isClickable
                        ? this.props.onHighlightClick
                        : undefined
                }
                hasComment={this.props.comment?.length > 0}
            >
                <ActionBox>{actionsBox}</ActionBox>
                <Highlightbar />
                <Markdown pageUrl={this.props.pageUrl}>
                    {this.state.isTruncatedHighlight
                        ? this.state.truncatedTextHighlight
                        : this.props.body}
                </Markdown>
            </HighlightStyled>
        )
    }

    private setTextAreaHeight() {
        let lines = 1

        if (this.props.comment) {
            lines = this.props.comment.split(/\r\n|\r|\n/).length
        }

        const height = lines * 20
        const heightinPX = (height + 'px').toString()
        this.setState({ editorHeight: heightinPX })
    }

    private renderNote() {
        const {
            comment,
            isEditing,
            annotationEditDependencies,
            annotationFooterDependencies,
        } = this.props

        if (isEditing) {
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
            return
        }

        return (
            <CommentBox>
                {!this.theme.hasHighlight &&
                    this.state.hoverCard &&
                    this.props.currentUserId === this.props.creatorId && (
                        <ActionBox>
                            <TooltipBox
                                tooltipText="Edit Note"
                                placement="bottom"
                            >
                                <Icon
                                    onClick={
                                        annotationFooterDependencies?.onEditIconClick
                                    }
                                    icon={'edit'}
                                    heightAndWidth={'18px'}
                                    borderColor={'greyScale3'}
                                    background={'greyScale1'}
                                />
                            </TooltipBox>
                        </ActionBox>
                    )}
                <NoteTextBox hasHighlight={this.theme.hasHighlight}>
                    <NoteText
                        contextLocation={this.props.contextLocation}
                        getYoutubePlayer={this.props.getYoutubePlayer}
                    >
                        {this.state.isTruncatedNote
                            ? this.state.truncatedTextComment
                            : comment}
                    </NoteText>
                </NoteTextBox>
            </CommentBox>
        )
    }

    private isAnyModalOpen() {
        return (
            this.state.showCopyPaster ||
            this.state.showQuickTutorial ||
            this.state.showShareMenu ||
            this.state.showSpacePicker !== 'hide'
        )
    }

    private calcFooterActions(): ItemBoxBottomAction[] {
        const {
            annotationFooterDependencies: footerDeps,
            repliesLoadingState,
            appendRepliesToggle,
            onReplyBtnClick,
            hasReplies,
        } = this.props

        const repliesToggle: ItemBoxBottomAction =
            repliesLoadingState === 'success'
                ? {
                      key: 'replies-btn',
                      onClick: onReplyBtnClick,
                      tooltipText: 'Show replies',
                      imageColor: 'prime1',
                      image: hasReplies ? 'commentFull' : 'commentAdd',
                  }
                : {
                      key: 'replies-btn',
                      node: <LoadingIndicator size={16} />,
                  }

        if (!footerDeps) {
            return [repliesToggle]
        }

        if (!this.state.hoverCard && appendRepliesToggle) {
            return [repliesToggle]
        }

        if (this.state.hoverCard || this.isAnyModalOpen()) {
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
                    imageColor: 'prime1',
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
                imageColor: 'prime1',
                // onClick: () => this.updateSpacePickerState('footer'),
                // buttonRef: this.props.spacePickerButtonRef,
                // active: this.state.showSpacePicker === 'footer',
            },
            appendRepliesToggle && repliesToggle,
        ]
    }

    private renderFooter() {
        const {
            isShared,
            isEditing,
            isDeleting,
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

        if ((!isEditing && !isDeleting) || footerDeps == null) {
            return (
                <DefaultFooterStyled>
                    {footerDeps != null && (
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
                    )}
                    <ItemBoxBottom
                        borderTop={false}
                        creationInfo={this.creationInfo}
                        actions={this.calcFooterActions()}
                    />
                    {this.renderSpacePicker(
                        this.props.spacePickerButtonRef,
                        'footer',
                    )}
                    {this.renderShareMenu(this.shareButtonRef)}
                </DefaultFooterStyled>
            )
        }

        if (isDeleting) {
            cancelBtnHandler = footerDeps.onDeleteCancel
            confirmBtn = (
                <ActionBtnStyled onClick={footerDeps.onDeleteConfirm}>
                    Delete
                    <Icon
                        filePath={icons.check}
                        color={'prime1'}
                        heightAndWidth={'20px'}
                        hoverOff
                    />
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
                    tabIndex={0}
                    shortcutText={`${AnnotationEditable.MOD_KEY} + Enter`}
                />
            )
        }

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

                <DeletionBox>
                    {isDeleting && (
                        <DeleteConfirmStyled>Really?</DeleteConfirmStyled>
                    )}
                    <SaveActionBar>
                        <BtnContainerStyled>
                            <Icon
                                onClick={cancelBtnHandler}
                                icon={icons.removeX}
                                color={'white'}
                                heightAndWidth="18px"
                            />
                            {confirmBtn}
                        </BtnContainerStyled>
                        {/* {this.renderMarkdownHelpButton()} */}
                    </SaveActionBar>
                    {this.renderSpacePicker(
                        this.props.spacePickerButtonRef,
                        'footer',
                    )}
                    {this.state.showShareMenu &&
                        this.renderShareMenu(this.shareButtonRef)}
                </DeletionBox>
            </DefaultFooterStyled>
        )
    }

    private renderSpacePicker = (
        referenceElement: React.RefObject<HTMLElement>,
        showWhen: ListPickerShowState,
    ) => {
        if (this.state.showSpacePicker !== showWhen) {
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
                {this.props.renderListsPickerForAnnotation(
                    this.props.unifiedId,
                )}
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
                strategy={'fixed'}
                closeComponent={() => {
                    this.setState({
                        showShareMenu: false,
                    })
                }}
                offsetX={10}
            >
                {this.props.renderShareMenuForAnnotation(this.props.unifiedId)}
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
                {this.props.renderCopyPasterForAnnotation(this.props.unifiedId)}
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
                    onMouseEnter={() => this.setState({ hoverCard: true })}
                    onMouseOver={() => this.setState({ hoverCard: true })}
                    onMouseLeave={() => this.setState({ hoverCard: false })}
                >
                    <ItemBox
                        firstDivProps={{
                            id: ANNOT_BOX_ID_PREFIX + this.props.unifiedId,
                        }}
                    >
                        <AnnotationStyled>
                            <ContentContainer
                                onDoubleClick={
                                    this.props.isEditing
                                        ? undefined
                                        : annotationFooterDependencies?.onEditIconClick
                                }
                                isEditMode={this.props.isEditing}
                                onMouseEnter={() =>
                                    this.setState({
                                        hoverEditArea: true,
                                    })
                                }
                                onMouseLeave={() =>
                                    this.setState({
                                        hoverEditArea: false,
                                    })
                                }
                            >
                                {this.renderHighlightBody()}
                                {this.renderNote()}
                            </ContentContainer>
                            {((this.props.lists.length > 0 &&
                                this.displayLists.length > 0) ||
                                this.props.isEditing) && (
                                <ListsSegment
                                    tabIndex={0}
                                    lists={this.displayLists}
                                    onMouseEnter={this.props.onListsHover}
                                    onListClick={this.props.onListClick}
                                    onEditBtnClick={() =>
                                        this.updateSpacePickerState('lists-bar')
                                    }
                                    spacePickerButtonRef={
                                        this.spacePickerBarRef
                                    }
                                    padding={
                                        this.props.isEditing
                                            ? '10px 15px 10px 10px'
                                            : '0px 15px 10px 15px'
                                    }
                                />
                            )}
                            {this.renderFooter()}
                        </AnnotationStyled>
                        {this.renderCopyPaster(this.copyPasterButtonRef)}
                    </ItemBox>
                    {this.renderSpacePicker(
                        this.spacePickerBarRef,
                        'lists-bar',
                    )}
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

const HighlightContent = styled.div`
    position: relative;
    width: fill-available;
`

const Highlightbar = styled.div`
    background-color: ${(props) => props.theme.colors.prime1};
    margin-right: 10px;
    border-radius: 2px;
    width: 4px;
`

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
    z-index: 1;
    position: absolute;
    right: 15px;
`

const HighlightTextBox = styled.div`
    position: relative;
`

const HighlightText = styled.span`
    /* box-decoration-break: clone;
    overflow: hidden;
    line-height: 25px;
    font-style: normal;
    border-radius: 3px;
    background-color: ${(props) => props.theme.colors.highlightColorDefault};
    color: ${(props) => props.theme.colors.black};
    padding: 2px 5px; */
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
    display: flex;
    position: relative;

    ${(props) =>
        !props.hasComment &&
        css`
            padding: 15px 15px 15px 15px;
        `}
`

const CommentBox = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    font-weight: 300;
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
    margin: 0px;
    padding: 10px 20px 10px;
    line-height: 1.4;
    text-align: left;
    //border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    overflow: visible;
    flex-direction: row;
    display: flex;

    /* &:first-child {
        padding: 15px 20px 20px;
    } */

    ${({ theme }: { theme: SidebarAnnotationTheme }) =>
        !theme.hasHighlight &&
        `
        padding: 10px 20px 10px;
        border-top: none;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    `}
`

const DefaultFooterStyled = styled.div`
    display: flex;
    align-items: center;
    padding-left: 5px;
    justify-content: space-between;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};
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
        outline: 1px solid ${theme.colors.prime1}60;
    `};
`

const ContentContainer = styled.div<{ isEditMode: boolean }>`
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    z-index: 1001;
    position: relative;

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
    color: ${(props) => props.theme.colors.white};
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
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.white};
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
    padding: 5px 5px 5px 15px;
`
