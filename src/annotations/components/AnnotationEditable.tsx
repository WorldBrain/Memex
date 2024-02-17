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
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import ListsSegment from 'src/common-ui/components/result-item-spaces-segment'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type { ListPickerShowState } from 'src/dashboard-refactor/search-results/types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import type { RGBAColor, UnifiedAnnotation } from '../cache/types'
import { ANNOT_BOX_ID_PREFIX } from 'src/sidebar/annotations-sidebar/constants'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { Anchor } from 'src/highlighting/types'
import HighlightColorPicker from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker'
import tinycolor from 'tinycolor2'
import { RGBAobjectToString } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/utils'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { sleepPromise } from 'src/util/promises'
import CreationInfo from '@worldbrain/memex-common/lib/common-ui/components/creation-info'

export interface HighlightProps extends AnnotationProps {
    body: string
    comment?: string
    selector?: Anchor
    color?: RGBAColor
}

export interface NoteProps extends AnnotationProps {
    body?: string
    comment: string
}

export interface AnnotationProps {
    zIndex?: number
    tags: string[]
    lists: number[]
    /** Set this to filter out a specific list from being displayed on the annotation (e.g., in selected list mode). */
    listIdToFilterOut?: number
    createdWhen: Date | number
    isEditing?: boolean
    isEditingHighlight?: boolean
    isDeleting?: boolean
    initShowSpacePicker?: ListPickerShowState
    hoverState: NoteResultHoverState
    /** Required to decide how to go to an annotation when it's clicked. */
    unifiedId: string
    className?: string
    isActive?: boolean
    activeShareMenuNoteId?: string
    isShared: boolean
    shareMenuButtonRef?: React.RefObject<HTMLDivElement>
    copyPasterButtonRef?: React.RefObject<HTMLDivElement>
    spacePickerBodyButtonRef?: React.RefObject<HTMLDivElement>
    spacePickerFooterButtonRef?: React.RefObject<HTMLDivElement>
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
    onSpacePickerToggle?: (showState: ListPickerShowState) => void
    onCopyPasterToggle?: () => void
    onShareMenuToggle?: () => void
    getListDetailsById: ListDetailsGetter
    renderListsPickerForAnnotation?: (
        unifiedId: UnifiedAnnotation['unifiedId'],
        closePicker: () => void,
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
    copyPasterAnnotationInstanceId: string
    spacePickerAnnotationInstance: string
    shareMenuAnnotationInstanceId: string
    imageSupport: ImageSupportInterface<'caller'>
    selector?: Anchor
    saveHighlightColor?: (noteId, colorId, color) => void
    saveHighlightColorSettings?: (newState) => void
    getHighlightColorSettings?: () => void
    highlightColorSettings?: string
    color?: RGBAColor
    getRootElement: () => HTMLElement
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
    showHighlightColorPicker?: boolean
    showHighlightColorTooltip?: boolean
    currentHighlightColor?: RGBAColor
    defaultHighlightColor?: RGBAColor
}

export type Props = (HighlightProps | NoteProps) & AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props, State> {
    private annotEditRef = React.createRef<AnnotationEdit>()
    private tutorialButtonRef = React.createRef<HTMLElement>()
    private shareMenuButtonRef = React.createRef<HTMLDivElement>()
    private copyPasterButtonRef = React.createRef<HTMLDivElement>()
    private highlightsBarRef = React.createRef<HTMLDivElement>()
    private spacePickerBodyButtonRef = React.createRef<HTMLDivElement>()

    static MOD_KEY = getKeyName({ key: 'mod' })
    static defaultProps: Pick<Props, 'hoverState' | 'tags' | 'lists'> = {
        tags: [],
        lists: [],
        hoverState: null,
    }

    constructor(props: Props) {
        super(props)
        // Afford control from above by using passed down refs instead of local refs, if supplied
        if (props.copyPasterButtonRef) {
            this.copyPasterButtonRef = props.copyPasterButtonRef
        }
        if (props.shareMenuButtonRef) {
            this.shareMenuButtonRef = props.shareMenuButtonRef
        }
        if (props.spacePickerBodyButtonRef) {
            this.spacePickerBodyButtonRef = props.spacePickerBodyButtonRef
        }
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
        showHighlightColorPicker: false,
        showHighlightColorTooltip: false,
        defaultHighlightColor: null,
    }

    focusEditForm() {
        this.annotEditRef?.current?.focusEditor()
    }

    componentDidMount() {
        this.setTextAreaHeight()

        this.setState({
            currentHighlightColor: this.props.color,
        })
    }

    // This is a hack to ensure this state, which isn't available on init, only gets set once
    private hasInitShowSpacePickerChanged = false
    async componentDidUpdate(prevProps: Readonly<Props>) {
        if (
            !this.hasInitShowSpacePickerChanged &&
            this.props.initShowSpacePicker !== prevProps.initShowSpacePicker
        ) {
            await sleepPromise(200)
            this.props.onShareMenuToggle?.()
            this.hasInitShowSpacePickerChanged = true
            this.setState({
                showShareMenu: this.props.initShowSpacePicker === 'footer',
            })
        }
        if (prevProps.color != this.props.color) {
            this.setState({
                currentHighlightColor: this.props.color,
            })
        }

        if (
            prevProps.highlightColorSettings !=
            this.props.highlightColorSettings
        ) {
            const highlightColorSettings = JSON.parse(
                this.props.highlightColorSettings,
            )

            const defaultHighlightColor = highlightColorSettings.find(
                (setting) => setting.id === 'default',
            )['color']

            this.setState({
                defaultHighlightColor: defaultHighlightColor,
            })
        }
        if (!prevProps.isActive && this.props.isActive) {
            document.addEventListener('keydown', this.handleCmdCKeyPress)
        }
        if (prevProps.isActive && !this.props.isActive) {
            document.removeEventListener('keydown', this.handleCmdCKeyPress)
        }
    }

    private handleCmdCKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
            this.props.annotationFooterDependencies.onCopyPasterDefaultExecute()
            this.setState({ showCopyPaster: false })
        }
    }

    private copyAnnotationToClipboard = () => {
        const { body, comment } = this.props
        const textToCopy = `Comment: ${comment || 'N/A'}\n\nBody: ${
            body || 'N/A'
        }`
        navigator.clipboard.writeText(textToCopy).then(
            () => {
                console.log('Annotation copied to clipboard')
            },
            (err) => {
                console.error('Could not copy annotation to clipboard: ', err)
            },
        )
    }

    private updateSpacePickerState(showState: ListPickerShowState) {
        this.props.onSpacePickerToggle?.(showState)
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
        type: 'page-link' | 'user-list' | 'special-list'
    }> {
        const { lists, listIdToFilterOut, getListDetailsById } = this.props

        const displayLists = lists
            .filter(
                (list) =>
                    list !== SPECIAL_LIST_IDS.INBOX &&
                    list !== SPECIAL_LIST_IDS.MOBILE &&
                    list !== SPECIAL_LIST_IDS.FEED &&
                    list != this.props.listIdToFilterOut,
            )
            .map((id) => ({
                id,
                ...getListDetailsById(id),
            }))

        return displayLists
    }

    private get hasSharedLists(): boolean {
        return this.props.lists
            .map((id) => this.props.getListDetailsById(id))
            .some((list) => list.isShared)
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

        const isScreenshotAnnotation = this.props.selector?.dimensions != null
        let barColor = null

        if (this.state.defaultHighlightColor) {
            barColor = RGBAobjectToString(this.state.defaultHighlightColor)
        }
        if (this.state.currentHighlightColor) {
            barColor = RGBAobjectToString(this.state.currentHighlightColor)
        }

        return (
            <HighlightStyled
                onClick={this.props.onHighlightClick}
                hasComment={this.props.comment?.length > 0}
                onDoubleClick={
                    this.props.isEditingHighlight
                        ? undefined
                        : this.props.annotationFooterDependencies
                              ?.onEditHighlightIconClick
                }
            >
                {this.creationInfo?.createdWhen && (
                    <CreationInfo {...this.creationInfo} />
                )}
                <HighlightSection>
                    {this.renderHighlightsColorPicker(
                        this.props.unifiedId,
                        this.props.color,
                    )}

                    {this.renderHighlightsColorTooltip()}

                    {!isScreenshotAnnotation && (
                        <Highlightbar
                            onMouseEnter={() =>
                                this.setState({
                                    showHighlightColorTooltip: true,
                                })
                            }
                            onMouseLeave={() =>
                                this.setState({
                                    showHighlightColorTooltip: false,
                                })
                            }
                            ref={this.highlightsBarRef}
                            onClick={() =>
                                this.setState({
                                    showHighlightColorPicker: !this.state
                                        .showHighlightColorPicker,
                                })
                            }
                            barColor={barColor}
                        />
                    )}
                    {/* This is the highlight Editing section, not the annotationEditSection */}
                    {this.props.isEditingHighlight ? (
                        <HighlightEditContainer
                            hasHighlight={this.theme.hasHighlight}
                        >
                            <AnnotationEdit
                                ref={this.annotEditRef}
                                {...this.props.annotationEditDependencies}
                                rows={2}
                                editorHeight={this.state.editorHeight}
                                isShared={this.props.isShared}
                                isBulkShareProtected={
                                    this.props.isBulkShareProtected
                                }
                                getYoutubePlayer={this.props.getYoutubePlayer}
                                imageSupport={this.props.imageSupport}
                                comment={this.props.body}
                                onCommentChange={
                                    this.props.annotationEditDependencies
                                        .onBodyChange
                                }
                                slimEditorActions={true}
                            />
                        </HighlightEditContainer>
                    ) : (
                        <Markdown
                            imageSupport={this.props.imageSupport}
                            isHighlight
                            pageUrl={this.props.pageUrl}
                        >
                            {this.state.isTruncatedHighlight
                                ? this.state.truncatedTextHighlight
                                : this.props.body}
                        </Markdown>
                    )}
                </HighlightSection>
            </HighlightStyled>
        )
    }

    private renderHighlightsColorTooltip() {
        if (
            this.state.showHighlightColorTooltip &&
            !this.state.showHighlightColorPicker &&
            this.props.color != null
        ) {
            const settings = JSON.parse(this.props.highlightColorSettings)

            const label = settings.find(
                (setting) =>
                    JSON.stringify(setting.color) ===
                    JSON.stringify(this.props.color),
            )?.label

            if (label) {
                return (
                    <PopoutBox
                        targetElementRef={this.highlightsBarRef.current}
                        offsetX={5}
                        placement={'right-start'}
                        closeComponent={() =>
                            this.setState({
                                showHighlightColorTooltip: false,
                            })
                        }
                        instaClose
                        disableBlur
                        getPortalRoot={this.props.getRootElement}
                    >
                        {/* {this.props.highlightColorSettings[]} */}
                        <LabelBox>{label}</LabelBox>
                    </PopoutBox>
                )
            }
        }
    }
    private renderHighlightsColorPicker(unifiedId, selectedColor) {
        if (this.state.showHighlightColorPicker) {
            return (
                <PopoutBox
                    targetElementRef={this.highlightsBarRef.current}
                    closeComponent={() =>
                        this.setState({
                            showHighlightColorPicker: false,
                        })
                    }
                    offsetX={5}
                    placement={'right-start'}
                    disableBlur
                    getPortalRoot={this.props.getRootElement}
                >
                    <HighlightColorPicker
                        saveHighlightColorSettings={
                            this.props.saveHighlightColorSettings
                        }
                        changeHighlightColor={(
                            color: RGBAColor | string,
                            colorId,
                        ) => {
                            this.props.saveHighlightColor(
                                unifiedId,
                                colorId,
                                color,
                            )
                            this.setState({
                                showHighlightColorPicker: false,
                            })
                        }}
                        getHighlightColorSettings={
                            this.props.getHighlightColorSettings
                        }
                        highlightColorSettings={
                            this.props.highlightColorSettings
                        }
                        selectedColor={selectedColor}
                    />
                </PopoutBox>
            )
        }
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

        const actionsBox =
            !this.props.isEditingHighlight && this.state.hoverCard ? (
                <HighlightActionsBox>
                    {annotationFooterDependencies?.onEditIconClick &&
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
                            getPortalRoot={this.props.getRootElement}
                        >
                            <Icon
                                onClick={
                                    annotationFooterDependencies.onEditIconClick
                                }
                                icon={'edit'}
                                heightAndWidth={'18px'}
                                borderColor={'greyScale3'}
                                background={'greyScale1'}
                            />
                        </TooltipBox>
                    ) : undefined}
                </HighlightActionsBox>
            ) : null

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
                        imageSupport={this.props.imageSupport}
                    />
                </AnnotationEditContainer>
            )
        }

        if (!comment?.length) {
            return
        }

        return (
            <CommentBox
                onDoubleClick={
                    this.props.isEditing
                        ? undefined
                        : this.props.annotationFooterDependencies
                              ?.onEditIconClick
                }
            >
                <ActionBox>{actionsBox}</ActionBox>

                {!this.theme.hasHighlight &&
                    this.state.hoverCard &&
                    this.props.currentUserId === this.props.creatorId && (
                        <ActionBox>
                            <TooltipBox
                                tooltipText={
                                    <span>
                                        Edit Note <br />
                                        <strong>Pro Tip:</strong> Double Click
                                        Card
                                    </span>
                                }
                                placement="bottom-end"
                                getPortalRoot={this.props.getRootElement}
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
                        imageSupport={this.props.imageSupport}
                    >
                        {comment}
                        {/* {this.state.isTruncatedNote
                            ? this.state.truncatedTextComment
                            : comment} */}
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

        // const repliesToggle: ItemBoxBottomAction =
        //     repliesLoadingState === 'success'
        //         ? {
        //               key: 'replies-btn',
        //               onClick: onReplyBtnClick,
        //               tooltipText: 'Show replies',
        //               imageColor: 'prime1',
        //               image: hasReplies ? 'commentFull' : 'commentAdd',
        //           }
        //         : {
        //               key: 'replies-btn',
        //               node: <LoadingIndicator size={16} />,
        //           }

        // if (!footerDeps) {
        //     return [repliesToggle]
        // }

        // if (!this.state.hoverCard && appendRepliesToggle) {
        //     return [repliesToggle]
        // }

        return [
            {
                key: 'add-spaces-to-note-btn',
                image: 'plus',
                isLoading:
                    this.props.annotationEditDependencies.copyLoadingState ===
                    'running',
                onClick: () => {
                    this.props.onShareMenuToggle?.()
                    this.setState({
                        showShareMenu: true,
                    })
                },
                tooltipText: 'Add to Space(s)',
                ButtonText: 'Spaces',
                active:
                    this.props.shareMenuAnnotationInstanceId ===
                    this.props.unifiedId,
                buttonRef: this.shareMenuButtonRef,
            },
            {
                key: 'copy-paste-note-btn',
                image:
                    this.props.annotationEditDependencies.copyLoadingState ===
                    'success'
                        ? 'check'
                        : 'copy',
                isLoading:
                    this.props.annotationEditDependencies.copyLoadingState ===
                    'running',
                onClick: (event) => {
                    if (event.shiftKey) {
                        this.props.annotationFooterDependencies.onCopyPasterDefaultExecute()
                        this.setState({ showCopyPaster: false })
                    } else {
                        this.props.onCopyPasterToggle?.()
                        this.setState({ showCopyPaster: true })
                    }
                },
                onMouseDown: (event) => {
                    if (event.shiftKey && this.state.showCopyPaster) {
                        this.props.annotationFooterDependencies.onCopyPasterDefaultExecute()
                    }
                },
                tooltipText: (
                    <span>
                        <strong>Click</strong> to show options. <br />
                        <strong>Shift+Click</strong> to copy note with default
                        template.
                    </span>
                ),
                ButtonText: 'Cite',
                active:
                    this.props.copyPasterAnnotationInstanceId ===
                    this.props.unifiedId,
                buttonRef: this.copyPasterButtonRef,
            },
            // {
            //     key: 'ask-ai-note-btn',
            //     image:
            //         this.props.annotationEditDependencies.copyLoadingState ===
            //         'success'
            //             ? 'check'
            //             : 'feed',
            //     isLoading:
            //         this.props.annotationEditDependencies.copyLoadingState ===
            //         'running',
            //     onMouseDown: (event) => {
            //         // if (!this.state.showCopyPaster) {
            //         //     // this.props.showPopoutsForResultBox(this.props.index)
            //         //     this.props.onCopyPasterToggle?.()
            //         //     this.setState({ showCopyPaster: true })
            //         // }
            //     },
            //     onMouseUp: (event) => {
            //         // if (!this.state.showCopyPaster) {
            //         //     console.log('onMouseUp')
            //         //     this.props.annotationFooterDependencies.onCopyPasterDefaultExecute(
            //         //         event,
            //         //     )
            //         // }
            //     },
            //     tooltipText: 'Ask AI',
            //     ButtonText: 'Ask AI',
            //     // active:
            //     //     this.props.copyPasterAnnotationInstanceId ===
            //     //     this.props.unifiedId,
            //     // buttonRef: this.copyPasterButtonRef,
            // },
            // appendRepliesToggle && {
            //     key: 'show-replies-notes-btn',
            //     image:
            //         this.props.annotationEditDependencies.copyLoadingState ===
            //         'success'
            //             ? 'check'
            //             : 'commentAdd',
            //     isLoading:
            //         this.props.annotationEditDependencies.copyLoadingState ===
            //         'running',
            //     onMouseDown: (event) => {
            //         // if (!this.state.showCopyPaster) {
            //         //     // this.props.showPopoutsForResultBox(this.props.index)
            //         //     this.props.onCopyPasterToggle?.()
            //         //     this.setState({ showCopyPaster: true })
            //         // }
            //     },
            //     onMouseUp: (event) => {
            //         if (!this.state.showCopyPaster) {
            //             // console.log('onMouseUp')
            //             // this.props.annotationFooterDependencies.onCopyPasterDefaultExecute(
            //             //     event,
            //             // )
            //         }
            //     },
            //     tooltipText: 'Ask AI',
            //     ButtonText: 'Replies',
            //     // active:
            //     //     this.props.copyPasterAnnotationInstanceId ===
            //     //     this.props.unifiedId,
            //     // buttonRef: this.copyPasterButtonRef,
            // },
            // {
            //     key: 'add-spaces-btn',
            //     image: 'plus',
            //     imageColor: 'prime1',
            //     tooltipText: 'Add Note to Spaces',
            //     onClick: () => this.updateSpacePickerState('footer'),
            //     buttonRef: this.spacePickerFooterButtonRef,
            //     active:
            //         this.props.spacePickerAnnotationInstance ===
            //         this.props.unifiedId,
            // },
            // appendRepliesToggle && repliesToggle,
        ]
    }

    private renderFooter() {
        const {
            isShared,
            isEditing,
            isEditingHighlight,
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

        if (
            (!isEditing && !isEditingHighlight && !isDeleting) ||
            footerDeps == null
        ) {
            return (
                <DefaultFooterStyled>
                    {/* {footerDeps != null && (
                        <TooltipBox
                            tooltipText={
                                shareIconData.label === 'Private' ? (
                                    <span>Only manually added to Spaces</span>
                                ) : shareIconData.label === 'Shared' ? (
                                    <span>Shared in some Spaces</span>
                                ) : (
                                    <span>
                                        Auto-added to all Spaces <br /> the
                                        document is in
                                    </span>
                                )
                            }
                            placement="bottom-start"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <PrimaryAction
                                onClick={() => {
                                    this.props.onShareMenuToggle?.()
                                    this.setState({
                                        showShareMenu: true,
                                    })
                                }}
                                label={'Spaces'}
                                icon={
                                    this.displayLists.length > 0 ? (
                                        <ListCounter isShared={isShared}>
                                            {isShared && (
                                                <Icon
                                                    icon={'spread'}
                                                    heightAndWidth="24px"
                                                    color={'prime1'}
                                                    hoverOff
                                                />
                                            )}
                                            {this.displayLists.length}
                                        </ListCounter>
                                    ) : (
                                        'plus'
                                    )
                                }
                                iconColor={
                                    this.displayLists.length > 0
                                        ? 'white'
                                        : 'prime1'
                                }
                                size={'small'}
                                type={'tertiary'}
                                padding="0px 4px 0px 2px"
                                innerRef={this.shareMenuButtonRef}
                                active={
                                    this.props.shareMenuAnnotationInstanceId ===
                                    this.props.unifiedId
                                }
                            />
                        </TooltipBox>
                    )} */}

                    <ItemBoxBottom
                        borderTop={false}
                        creationInfo={this.creationInfo}
                        actions={this.calcFooterActions()}
                        getRootElement={this.props.getRootElement}
                    />
                    {this.renderSpacePicker(
                        this.shareMenuButtonRef,
                        this.state.showSpacePicker,
                    )}
                    {this.renderShareMenu(this.shareMenuButtonRef)}
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
                    getRootElement={this.props.getRootElement}
                />
            )
        }

        return (
            <DefaultFooterStyled>
                <ShareMenuContainer>
                    <PrimaryAction
                        onClick={() => {
                            this.props.onShareMenuToggle?.()
                            this.setState({
                                showShareMenu: true,
                            })
                        }}
                        label={'Spaces'}
                        icon={
                            this.displayLists.length > 0 ? (
                                <ListCounter isShared={isShared}>
                                    {isShared && (
                                        <Icon
                                            icon={'spread'}
                                            heightAndWidth="24px"
                                            color={'prime1'}
                                            hoverOff
                                        />
                                    )}
                                    {this.displayLists.length}
                                </ListCounter>
                            ) : (
                                'plus'
                            )
                        }
                        iconColor={
                            this.props.lists.length > 0 ? 'white' : 'prime1'
                        }
                        size={'small'}
                        type={'tertiary'}
                        padding="0px 4px 0px 2px"
                        innerRef={this.shareMenuButtonRef}
                        active={this.state.showShareMenu}
                    />
                </ShareMenuContainer>

                <DeletionBox>
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
                    {this.renderSpacePicker(this.shareMenuButtonRef, 'footer')}
                    {this.state.showShareMenu &&
                        this.renderShareMenu(this.shareMenuButtonRef)}
                </DeletionBox>
            </DefaultFooterStyled>
        )
    }

    private renderSpacePicker = (
        referenceElement: React.RefObject<HTMLElement>,
        showWhen: ListPickerShowState,
    ) => {
        // NOTE: If ref passed down, rendering assumed to be a concern of ancestor
        if (
            this.state.showSpacePicker !== showWhen ||
            this.state.showSpacePicker === 'hide'
        ) {
            return null
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
                getPortalRoot={this.props.getRootElement}
            >
                {this.props.renderListsPickerForAnnotation(
                    this.props.unifiedId,
                    () =>
                        this.setState({
                            showSpacePicker: 'hide',
                        }),
                )}
            </PopoutBox>
        )
    }

    private renderShareMenu(referenceElement: React.RefObject<HTMLElement>) {
        // NOTE: If ref passed down, rendering assumed to be a concern of ancestor
        if (
            !this.state.showShareMenu ||
            this.props.shareMenuButtonRef != null
        ) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={referenceElement.current}
                placement={'left'}
                strategy={'fixed'}
                closeComponent={() => {
                    this.setState({
                        showShareMenu: false,
                    })
                }}
                offsetX={100}
                width={'310px'}
                getPortalRoot={this.props.getRootElement}
            >
                {this.props.renderShareMenuForAnnotation(this.props.unifiedId)}
            </PopoutBox>
        )
    }

    private renderCopyPaster(referenceElement: React.RefObject<HTMLElement>) {
        // NOTE: If ref passed down, rendering assumed to be a concern of ancestor
        if (
            !this.state.showCopyPaster ||
            this.props.copyPasterButtonRef != null
        ) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={referenceElement.current}
                placement={'bottom-end'}
                closeComponent={() => {
                    console.log('closeComponent')
                    this.setState({
                        showCopyPaster: false,
                    })
                }}
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                {this.props.renderCopyPasterForAnnotation(this.props.unifiedId)}
            </PopoutBox>
        )
    }

    render() {
        const { annotationFooterDependencies } = this.props

        const {
            annotationFooterDependencies: footerDeps,
            onGoToAnnotation,
        } = this.props

        const actionsBox =
            !this.props.isEditingHighlight && this.state.hoverCard ? (
                <HighlightActionsBox>
                    {onGoToAnnotation && (
                        <TooltipBox
                            tooltipText="Open in Page"
                            placement="bottom"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <Icon
                                onClick={onGoToAnnotation}
                                filePath={'goTo'}
                                heightAndWidth={'20px'}
                                borderColor={'transparent'}
                                hoverOff
                            />
                        </TooltipBox>
                    )}
                    {footerDeps?.onEditHighlightIconClick &&
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
                            getPortalRoot={this.props.getRootElement}
                        >
                            <Icon
                                onClick={footerDeps.onEditHighlightIconClick}
                                filePath={'edit'}
                                heightAndWidth={'20px'}
                                borderColor={'transparent'}
                                hoverOff
                            />
                        </TooltipBox>
                    ) : undefined}
                </HighlightActionsBox>
            ) : null

        return (
            <ThemeProvider theme={this.theme}>
                <AnnotationBox
                    zIndex={this.props.zIndex}
                    top="5px"
                    onMouseEnter={() => this.setState({ hoverCard: true })}
                    onMouseOver={() => this.setState({ hoverCard: true })}
                    onMouseLeave={() =>
                        !this.isAnyModalOpen() &&
                        this.setState({ hoverCard: false })
                    }
                >
                    <ItemBox
                        firstDivProps={{
                            id: ANNOT_BOX_ID_PREFIX + this.props.unifiedId,
                        }}
                    >
                        <AnnotationStyled>
                            <ActionBox>{actionsBox}</ActionBox>
                            <ContentContainer
                                isEditMode={
                                    this.props.isEditing ||
                                    this.props.isEditingHighlight
                                }
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
                            {this.displayLists.length >= 1 && (
                                <ListsSegment
                                    tabIndex={0}
                                    lists={this.displayLists}
                                    onMouseEnter={this.props.onListsHover}
                                    onListClick={this.props.onListClick}
                                    onEditBtnClick={() => null}
                                    spacePickerButtonRef={
                                        this.spacePickerBodyButtonRef
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
                    {/* {this.renderSpacePicker(
                        this.spacePickerBodyButtonRef,
                        'lists-bar',
                    )} */}
                </AnnotationBox>
                {this.state.showQuickTutorial && (
                    <PopoutBox
                        targetElementRef={this.tutorialButtonRef.current}
                        placement={'bottom'}
                        closeComponent={() => this.toggleShowTutorial()}
                        getPortalRoot={this.props.getRootElement}
                    >
                        <QuickTutorial
                            markdownHelpOnTop={true}
                            getKeyboardShortcutsState={
                                getKeyboardShortcutsState
                            }
                            getRootElement={this.props.getRootElement}
                        />
                    </PopoutBox>
                )}
            </ThemeProvider>
        )
    }
}

const HighlightSection = styled.div`
    display: flex;
    margin-top: 5px;
`

const ShareMenuContainer = styled.div`
    display: flex;
`

const HighlightContent = styled.div`
    position: relative;
    width: fill-available;
`

const TooltipBoxContainer = styled(TooltipBox)`
    width: 5px;
`

const Highlightbar = styled.div<{ barColor: string }>`
    background: ${(props) => props.theme.colors.prime1};
    margin-right: 10px;
    border-radius: 2px;
    width: 5px;
    cursor: pointer;

    &:hover {
        background: ${(props) =>
            props.theme.variant === 'dark'
                ? tinycolor(props.theme.colors.prime1).lighten(25).toHexString()
                : tinycolor(props.theme.colors.prime1)
                      .darken(25)
                      .toHexString()};
    }

    ${(props) =>
        props.barColor &&
        css<any>`
            background: ${(props) => props.barColor};

            &:hover {
                background: ${(props) =>
                    props.theme.variant === 'dark'
                        ? tinycolor(props.barColor).lighten(25).toHexString()
                        : tinycolor(props.barColor).darken(25).toHexString()};
            }
        `}
`

const ListCounter = styled.div<{ isShared: boolean }>`
    width: fit-content;
    grid-gap: 5px;
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: center;
    padding: ${(props) => (props.isShared ? '5px 0 5px 0' : '5px 0 5px 8px')};
    margin-right: 4px;
`

const AnnotationEditContainer = styled.div<{ hasHighlight: boolean }>`
    margin-top: ${(props) => !props.hasHighlight && '10px'};
    width: 100%;
    position: relative;
`
const HighlightEditContainer = styled.div<{ hasHighlight: boolean }>`
    margin-top: ${(props) => !props.hasHighlight && '10px'};
    width: fill-available;
    position: relative;

    & > div {
        padding: 0px;
    }
`

const AnnotationBox = styled(Margin)<{ zIndex: number }>`
    width: 100%;
    align-self: center;
    z-index: ${(props) => props.zIndex};
`

const LabelBox = styled.div`
    padding: 8px 16px;
    color: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.greyScale7
            : props.theme.colors.greyScale6};
    font-size: 14px;
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
    justify-content: space-between;
    z-index: 10000;
    top: 0px;
    grid-gap: 5px;
    background: ${(props) => props.theme.colors.black}95;
    padding: 5px;

    backdrop-filter: blur(5px);
    border-radius: 8px;
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
    z-index: 10000000;
    position: absolute;
    right: 15px;
    top: 15px;
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
    padding: 15px 10px 7px 15px;
    line-height: 20px;
    text-align: left;
    grid-gap: 2px;
    line-break: normal;
    display: flex;
    position: relative;
    flex-direction: column;
    ${(props) =>
        !props.hasComment &&
        css`
            padding: 15px 10px 15px 15px;
        `};
`

const CommentBox = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    font-weight: 300;
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
    margin: 0px;
    padding: 10px 15px 10px;
    line-height: 1.4;
    text-align: left;
    //border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    overflow: visible;
    flex-direction: row;
    display: flex;
    position: relative;

    /* &:first-child {
        padding: 15px 20px 20px;
    } */

    ${({ theme }: { theme: SidebarAnnotationTheme }) =>
        !theme.hasHighlight &&
        `
        padding: 5px 15px 5px;
        border-top: none;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    `}
`

const DefaultFooterStyled = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 5px;
`

const AnnotationStyled = styled.div`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    cursor: pointer;
    border-radius: inherit;

    cursor: ${({ theme }) => theme.cursor}
        ${({ theme }) =>
            theme.isEditing &&
            css`
                background-color: ${(props) => props.theme.colors.greyScale1};
                cursor: default;
            `};

    ${({ theme }) =>
        theme.isActive &&
        `
        outline: 2px solid ${theme.colors.prime1}60;
    `};

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            box-shadow: ${props.theme.borderStyles.boxShadowHoverElements};
            border: 1px solid ${props.theme.colors.greyScale1};
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
