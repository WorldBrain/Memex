import * as React from 'react'
import styled, { ThemeProvider, css, keyframes } from 'styled-components'
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

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type { ListPickerShowState } from 'src/dashboard-refactor/search-results/types'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import type { RGBAColor, UnifiedAnnotation, UnifiedList } from '../cache/types'
import { ANNOT_BOX_ID_PREFIX } from 'src/sidebar/annotations-sidebar/constants'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { Anchor } from 'src/highlighting/types'

import tinycolor from 'tinycolor2'
import { RGBAobjectToString } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/utils'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { sleepPromise } from 'src/util/promises'
import CreationInfo from '@worldbrain/memex-common/lib/common-ui/components/creation-info'
import Checkbox from 'src/common-ui/components/Checkbox'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import type { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'
import CheckboxNotInput from 'src/common-ui/components/CheckboxNotInput'
import { SpaceSearchSuggestion } from '@worldbrain/memex-common/lib/editor'
import ListsSegment from '@worldbrain/memex-common/lib/common-ui/components/result-item-spaces-segment'
import HighlightColorPicker from './highlightColorPicker'
import { RemoteSyncSettingsInterface } from 'src/sync-settings/background/types'
import { DEFAULT_HIGHLIGHT_COLOR } from '@worldbrain/memex-common/lib/annotations/constants'

export interface HighlightProps extends AnnotationProps {
    body: string
    comment?: string
    selector?: Anchor
    color?: HighlightColor
}

export interface NoteProps extends AnnotationProps {
    body?: string
    comment: string
    isBulkSelected: boolean
}

export interface AnnotationProps {
    compactVersion?: boolean
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
    focusLockUntilMouseStart?: boolean
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
        closePicker: () => void,
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
    saveHighlightColor?: (color: HighlightColor['id']) => Promise<void>
    highlightColorSettings: HighlightColor[]
    color?: HighlightColor
    getRootElement: () => HTMLElement
    toggleAutoAdd: () => void
    isAutoAddEnabled?: boolean
    bulkSelectAnnotation?: () => void
    isBulkSelected?: boolean
    updateSpacesSearchSuggestions?: (query: string) => void
    spaceSearchSuggestions?: SpaceSearchSuggestion[]
    selectSpaceForEditorPicker?: (spaceId: number) => void
    removeSpaceFromEditorPicker: (spaceId: UnifiedList['localId']) => void
    addNewSpaceViaWikiLinksEditNote?: (
        spaceName: string,
        unifiedAnnotationId: UnifiedAnnotation['unifiedId'],
    ) => void
    setAnnotationInFocus?: (unifiedId: string) => void
    isInFocus?: boolean
    shiftSelectItem?: () => void
    searchTerms?: string[]
    syncSettingsBG: RemoteSyncSettingsInterface
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
    showAutoAddMenu: boolean
}

export type Props = (HighlightProps | NoteProps) & AnnotationEditableEventProps

export default class AnnotationEditable extends React.Component<Props, State> {
    private annotEditRef = React.createRef<AnnotationEdit>()
    itemBoxRef = React.createRef<HTMLDivElement>() // Assuming ItemBox renders a div element
    private tutorialButtonRef = React.createRef<HTMLElement>()
    private shareMenuButtonRef = React.createRef<HTMLDivElement>()
    private copyPasterButtonRef = React.createRef<HTMLDivElement>()
    private highlightsBarRef = React.createRef<HTMLDivElement>()
    private spacePickerBodyButtonRef = React.createRef<HTMLDivElement>()
    private autoAddButtonRef = React.createRef<HTMLDivElement>()

    static MOD_KEY = getKeyName({ key: 'mod' })
    static ALT_KEY = getKeyName({ key: 'alt' })
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
        showAutoAddMenu: false,
    }

    focusEditForm() {
        this.annotEditRef?.current?.focusEditor()
    }

    componentDidMount() {
        this.setTextAreaHeight()

        // if (!this.props.color) {
        //     const defaultHighlightSettings = this.props.highlightColorSettings?.find(
        //         (setting) => setting.id === 'default',
        //     )
        //     if (defaultHighlightSettings?.color) {
        //         this.setState({
        //             defaultHighlightColor: defaultHighlightSettings.color,
        //             currentHighlightColor: defaultHighlightSettings.color,
        //         })
        //     }
        // } else {
        //     this.setState({
        //         currentHighlightColor: this.props.color,
        //     })
        // }
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
        // if (prevProps.color != this.props.color) {
        //     this.setState({
        //         currentHighlightColor: this.props.color,
        //     })
        // }

        if (
            prevProps.highlightColorSettings !=
            this.props.highlightColorSettings
        ) {
            const defaultHighlightSettings = this.props.highlightColorSettings.find(
                (setting) => setting.id === 'default',
            )
            if (defaultHighlightSettings?.color) {
                this.setState({
                    defaultHighlightColor: defaultHighlightSettings.color,
                })
            }
        }
        if (!prevProps.isActive && this.props.isActive) {
            document.addEventListener('keydown', this.handleCmdCKeyPress)
        }
        if (prevProps.isActive && !this.props.isActive) {
            document.removeEventListener('keydown', this.handleCmdCKeyPress)
        }
        if (this.props.isInFocus && !prevProps.isInFocus) {
            this.setupKeyListener()
            if (!this.state.hoverCard) {
                const itemBox = this.itemBoxRef.current
                if (itemBox && !this.props.hoverState) {
                    itemBox.scrollIntoView({ block: 'center' })
                }
            }
        } else if (!this.props.isInFocus && prevProps.isInFocus) {
            // if (!this.state.hoverCard) {
            //     this.props.setAnnotationInFocus(null)
            // }
            this.removeKeyListener()
        }
    }

    setupKeyListener = () => {
        document.addEventListener('keydown', this.handleKeyDown)
    }

    removeKeyListener = () => {
        document.removeEventListener('keydown', this.handleKeyDown)
    }

    private handleCmdCKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
            this.props.annotationFooterDependencies.onCopyPasterDefaultExecute()
            this.setState({ showCopyPaster: false })
        }
    }

    handleKeyDown = (event: KeyboardEvent) => {
        if (!this.props.isInFocus) return
        if (document.getElementById('popout-boxes') != null) {
            return
        } else {
            switch (event.key) {
                case 's':
                    // Perform action for "s" key
                    this.props.onShareMenuToggle?.()
                    this.setState({
                        showShareMenu: true,
                    })
                    break
                case 'c':
                    // Perform action for "c" key
                    if (event.shiftKey) {
                        this.props.annotationFooterDependencies.onCopyPasterDefaultExecute()
                        this.setState({ showCopyPaster: false })
                    } else {
                        this.props.onCopyPasterToggle?.()
                        this.setState({ showCopyPaster: true })
                    }
                    break
                case 'Enter':
                    if (!this.props.isEditing) {
                        if (event.shiftKey && this.props.shiftSelectItem) {
                            // this.props.shiftSelectItem()
                            this.props.bulkSelectAnnotation()
                            event.preventDefault()
                            event.stopPropagation()
                        }
                    }
                    break
                case 'Backspace':
                    if (event.shiftKey) {
                        event.stopPropagation()
                        // Perform action for "shift+Enter" key
                        // this.props.onRemoveFromListBtnClick(event as any)
                    } else {
                        // Perform action for "Enter" key
                        const {
                            annotationFooterDependencies: footerDeps,
                        } = this.props
                        event.stopPropagation()
                        footerDeps.onDeleteIconClick(event as any)
                        break
                    }
                    // Perform action for "Backspace" key
                    break
                default:
                    break
            }
        }
    }

    private get displayLists(): Array<{
        localId: number
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
            .map((localId) => ({
                localId,
                ...getListDetailsById(localId),
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

    private renderHighlightBody() {
        if (!this.props.body) {
            return
        }

        const isScreenshotAnnotation = this.props.selector?.dimensions != null
        let barColor = RGBAobjectToString(DEFAULT_HIGHLIGHT_COLOR)
        if (this.props.color) {
            barColor = RGBAobjectToString(this.props.color.color)
        }

        // if (this.state.defaultHighlightColor) {
        //     barColor = RGBAobjectToString(this.props.color.color)
        // }
        // if (this.state.currentHighlightColor) {
        //     barColor = RGBAobjectToString(this.props.color.color)
        // }

        return (
            <HighlightStyled
                onClick={this.props.onHighlightClick}
                hasComment={this.props.comment?.length > 0}
                // onDoubleClick={
                //     this.props.isEditingHighlight
                //         ? undefined
                //         : this.props.annotationFooterDependencies
                //               ?.onEditHighlightIconClick
                // }
            >
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
                            isEditMode={this.props.isEditingHighlight}
                            onEditCancel={
                                this.props.annotationEditDependencies
                                    .onEditCancel
                            }
                            setEditing={
                                this.props.annotationFooterDependencies
                                    .onEditHighlightIconClick
                            }
                            updateSpacesSearchSuggestions={
                                this.props.updateSpacesSearchSuggestions
                            }
                            spaceSearchSuggestions={
                                this.props.spaceSearchSuggestions
                            }
                            selectSpaceForEditorPicker={
                                this.props.selectSpaceForEditorPicker
                            }
                            addNewSpaceViaWikiLinks={(spaceName) =>
                                this.props.addNewSpaceViaWikiLinksEditNote(
                                    spaceName,
                                    this.props.unifiedId,
                                )
                            }
                            searchTerms={this.props.searchTerms}
                        />
                    </HighlightEditContainer>
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
            const label = this.props.highlightColorSettings.find(
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
                        syncSettingsBG={this.props.syncSettingsBG}
                        annotationId={this.props.unifiedId}
                        selectedColor={this.props.color.id}
                        updateAnnotationColor={this.props.saveHighlightColor}
                    />
                </PopoutBox>
            )
        }
    }

    renderAutoAddDefaultSettings() {
        if (this.state.showAutoAddMenu) {
            return (
                <PopoutBox
                    targetElementRef={this.autoAddButtonRef?.current}
                    placement="bottom"
                    width="320px"
                    closeComponent={() =>
                        this.setState({ showAutoAddMenu: false })
                    }
                    // offsetY={-100}
                    // offsetX={-100}
                    instaClose
                    getPortalRoot={this.props.getRootElement}
                >
                    <AutoAddDefaultContainer>
                        <DefaultCheckBoxContainer>
                            <Checkbox
                                key={33}
                                id={'33'}
                                width="fit-content"
                                isChecked={this.props.isAutoAddEnabled === true}
                                handleChange={() => this.props.toggleAutoAdd()}
                                // isDisabled={!this.state.shortcutsEnabled}
                                name={
                                    this.props.isAutoAddEnabled
                                        ? 'Is Default'
                                        : 'Make Default'
                                }
                                label={
                                    'Auto-adding default for new annotations'
                                }
                                fontSize={14}
                                size={14}
                                isLoading={this.props.isAutoAddEnabled == null}
                            />
                        </DefaultCheckBoxContainer>
                        <TooltipTextBox>
                            {this.props.isShared ? (
                                <>
                                    <strong>
                                        <Icon
                                            icon={'spread'}
                                            color={'prime1'}
                                            hoverOff
                                            heightAndWidth="32px"
                                        />
                                        Added to all Spaces the document is in.
                                    </strong>
                                    For generally relevant annotations.
                                    <KeyboardShortCutBox>
                                        Do not add to all Spaces by using
                                        <KeyboardShortcuts
                                            keys={`shift+${AnnotationEditable.MOD_KEY}+enter`.split(
                                                '+',
                                            )}
                                            size={'small'}
                                            getRootElement={
                                                this.props.getRootElement
                                            }
                                        />
                                    </KeyboardShortCutBox>
                                </>
                            ) : (
                                <>
                                    <strong>
                                        Only added to Spaces
                                        <br />
                                        you manually put annotation in.
                                    </strong>
                                    <span>
                                        For context specific annotations.
                                        <br />
                                        Setting auto-disables when you select
                                        Spaces for indiviudal annotations.
                                    </span>
                                    <KeyboardShortCutBox>
                                        Save & Auto-Add to all Spaces the page
                                        is in
                                        <KeyboardShortcuts
                                            keys={`shift+${AnnotationEditable.MOD_KEY}+enter`.split(
                                                '+',
                                            )}
                                            size={'small'}
                                            getRootElement={
                                                this.props.getRootElement
                                            }
                                        />
                                    </KeyboardShortCutBox>
                                </>
                            )}
                        </TooltipTextBox>
                    </AutoAddDefaultContainer>
                </PopoutBox>
            )
        }
    }

    renderAutoAddedIndicator() {
        return (
            <AutoAddedIndicator ref={this.autoAddButtonRef}>
                <TooltipBox
                    tooltipText={
                        this.props.isShared ? (
                            <span>
                                Disable Auto-Add
                                <br /> Only added to Spaces you manually select
                            </span>
                        ) : (
                            <span>
                                Enable Auto-Add
                                <br /> Added to all Spaces the page is in
                            </span>
                        )
                    }
                    placement="bottom"
                    getPortalRoot={this.props.getRootElement}
                >
                    <Icon
                        heightAndWidth="24px"
                        icon={'spread'}
                        color={this.props.isShared ? 'prime1' : 'greyScale3'}
                        onClick={(event) => {
                            event.stopPropagation()
                            if (event.shiftKey) {
                                this.setState({ showAutoAddMenu: true })
                            } else {
                                this.props.annotationEditDependencies.onEditConfirm(
                                    false,
                                )(!this.props.isShared, !this.props.isShared)
                            }
                        }}
                        padding={'1px'}
                    />
                </TooltipBox>
            </AutoAddedIndicator>
        )
    }

    renderDeleteScreen(footerDeps) {
        if (this.props.isDeleting) {
            return (
                <DeleteScreenContainer>
                    <DeleteScreenTitle>
                        Deletion is not reversible. <br /> Are you sure?
                    </DeleteScreenTitle>
                    <DeleteScreenButtons>
                        <PrimaryAction
                            label="Confirm"
                            subLabel="Enter"
                            type="glass"
                            size="medium"
                            onClick={footerDeps.onDeleteConfirm}
                            padding={'5px 10px'}
                            height={'50px'}
                            width={'120px'}
                        />
                        <PrimaryAction
                            label="Cancel"
                            subLabel="Escape"
                            type="glass"
                            size="medium"
                            onClick={footerDeps.onDeleteCancel}
                            height={'50px'}
                            width={'120px'}
                            padding={'5px 10px'}
                        />
                    </DeleteScreenButtons>
                </DeleteScreenContainer>
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

        if (!comment?.length && !isEditing) {
            return
        }

        return (
            <AnnotationEditContainer
                isEditing={this.props.isEditing}
                hasHighlight={this.theme.hasHighlight}
            >
                <AnnotationEdit
                    ref={this.annotEditRef}
                    {...annotationEditDependencies}
                    rows={2}
                    editorHeight={this.state.editorHeight}
                    isShared={this.props.isShared}
                    isBulkShareProtected={this.props.isBulkShareProtected}
                    getYoutubePlayer={this.props.getYoutubePlayer}
                    imageSupport={this.props.imageSupport}
                    isEditMode={this.props.isEditing}
                    setEditing={annotationFooterDependencies.onEditIconClick}
                    comment={comment}
                    onCommentChange={
                        this.props.annotationEditDependencies.onCommentChange
                    }
                    onEditCancel={
                        this.props.annotationEditDependencies.onEditCancel
                    }
                    updateSpacesSearchSuggestions={
                        this.props.updateSpacesSearchSuggestions
                    }
                    spaceSearchSuggestions={this.props.spaceSearchSuggestions}
                    selectSpaceForEditorPicker={
                        this.props.selectSpaceForEditorPicker
                    }
                    addNewSpaceViaWikiLinks={(spaceName) =>
                        this.props.addNewSpaceViaWikiLinksEditNote(
                            spaceName,
                            this.props.unifiedId,
                        )
                    }
                    searchTerms={this.props.searchTerms}
                />
            </AnnotationEditContainer>
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
                iconSize: this.props.isShared && '20px',
                onClick: () => {
                    this.props.onShareMenuToggle?.()
                    this.setState({
                        showShareMenu: true,
                    })
                },
                tooltipText: 'Add to Space(s)',
                ButtonText: (
                    <NotesCounterContainer>
                        {this.displayLists?.length ? (
                            <NotesCounterTitle>
                                <NoteCounter>
                                    {this.displayLists?.length}
                                </NoteCounter>
                                Spaces
                            </NotesCounterTitle>
                        ) : (
                            <NotesCounterTitle>
                                <Icon
                                    heightAndWidth="16px"
                                    icon={'plus'}
                                    hoverOff
                                    color={
                                        this.props.isShared ? 'prime1' : null
                                    }
                                />
                                Add Space(s)
                            </NotesCounterTitle>
                        )}
                    </NotesCounterContainer>
                ),
                active:
                    this.props.shareMenuAnnotationInstanceId ===
                    this.props.unifiedId,
                buttonRef: this.shareMenuButtonRef,
                leftSideItem:
                    this.displayLists.length === 0
                        ? this.renderAutoAddedIndicator()
                        : null,
                showKeyShortcut: this.props.isInFocus && 'S',
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
                tooltipText: (
                    <span>
                        <strong>Click</strong> to show copy templates. <br />
                        <strong>Shift+Click</strong> to copy note with default
                        template.
                    </span>
                ),
                ButtonText: 'Cite',
                active:
                    this.props.copyPasterAnnotationInstanceId ===
                    this.props.unifiedId,
                buttonRef: this.copyPasterButtonRef,
                showKeyShortcut: this.props.isInFocus && 'C',
            },
            appendRepliesToggle && {
                key: 'show-replies-notes-btn',
                image: hasReplies ? 'commentFull' : 'commentAdd',
                onClick: onReplyBtnClick,
                isLoading: repliesLoadingState === 'running',
                ButtonText: 'Replies',
            },
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

        if (
            (!isEditing && !isEditingHighlight && !isDeleting) ||
            footerDeps == null
        ) {
            return (
                <ActionFooterStyled
                    compactVersion={this.props.compactVersion}
                    inFocus={this.props.isInFocus}
                    inPageMode={this.props.contextLocation === 'in-page'}
                    inEditMode={isEditing || isEditingHighlight}
                    isShown={
                        this.state.hoverCard ||
                        this.props.isInFocus ||
                        isEditing ||
                        isEditingHighlight
                    }
                >
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
                </ActionFooterStyled>
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
            <DefaultFooterStyled
                compactVersion={this.props.compactVersion}
                inFocus={this.props.isInFocus}
                inPageMode={this.props.contextLocation === 'in-page'}
                inEditMode={isEditing || isEditingHighlight}
                // isShown={
                //     isEditing ||
                //     isEditingHighlight ||
                //     isDeleting ||
                //     this.props.isInFocus
                // }
            >
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
                placement={'bottom-start'}
                strategy={'fixed'}
                closeComponent={() => {
                    this.setState({
                        showShareMenu: false,
                    })
                }}
                offsetX={10}
                width={'310px'}
                getPortalRoot={this.props.getRootElement}
            >
                {this.props.renderShareMenuForAnnotation(
                    this.props.unifiedId,
                    () => {
                        this.setState({
                            showShareMenu: false,
                        })
                    },
                )}
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

    private renderBulkSelectBtn(): JSX.Element {
        return (
            <TooltipBox
                tooltipText={
                    <span>
                        Multi Select Items
                        {this.props.contextLocation === 'in-page' ? (
                            <>
                                <br />
                                <strong>{AnnotationEditable.MOD_KEY}+A</strong>
                                to select all
                            </>
                        ) : null}
                    </span>
                }
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <BulkSelectButtonBox>
                    <CheckboxNotInput
                        isChecked={this.props.isBulkSelected}
                        onClick={(
                            event: React.MouseEvent<HTMLInputElement>,
                        ) => {
                            event.preventDefault()
                            event.stopPropagation()
                            if (
                                event.nativeEvent.shiftKey &&
                                this.props.shiftSelectItem
                            ) {
                                this.props.shiftSelectItem()
                            } else {
                                this.props.bulkSelectAnnotation()
                            }
                        }}
                        size={16}
                    />
                </BulkSelectButtonBox>
            </TooltipBox>
        )
    }

    hoverTimeout = null

    handleMouseEnter = () => {
        if (!this.props.focusLockUntilMouseStart) {
            this.setState({ hoverCard: true })
            this.hoverTimeout = setTimeout(() => {
                this.props.setAnnotationInFocus(this.props.unifiedId)
            }, 300)
        }
    }

    handleMouseLeave = () => {
        if (!this.props.focusLockUntilMouseStart && !this.isAnyModalOpen()) {
            this.setState({ hoverCard: false })
            if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout)
                this.hoverTimeout = null
            }
            if (!this.isAnyModalOpen()) {
                this.props.setAnnotationInFocus(null)
            }
        }
    }

    render() {
        const { annotationFooterDependencies } = this.props

        const {
            annotationFooterDependencies: footerDeps,
            onGoToAnnotation,
            bulkSelectAnnotation,
        } = this.props

        const actionsBox = !this.props.isEditingHighlight ? (
            <HighlightActionsBox>
                {(this.props.isInFocus || this.state.hoverCard) && (
                    <>
                        {footerDeps.onDeleteIconClick && (
                            <TooltipBox
                                tooltipText="Delete Note"
                                placement="bottom"
                                getPortalRoot={this.props.getRootElement}
                            >
                                <Icon
                                    onClick={footerDeps.onDeleteIconClick}
                                    filePath={'trash'}
                                    heightAndWidth={'20px'}
                                    borderColor={'transparent'}
                                    hoverOff
                                />
                            </TooltipBox>
                        )}
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
                                getPortalRoot={this.props.getRootElement}
                            >
                                <Icon
                                    onClick={footerDeps.onEditIconClick}
                                    filePath={'edit'}
                                    heightAndWidth={'20px'}
                                    borderColor={'transparent'}
                                    hoverOff
                                />
                            </TooltipBox>
                        ) : undefined}
                    </>
                )}
                {bulkSelectAnnotation &&
                    (this.props.isBulkSelected ||
                        this.state.hoverCard ||
                        this.props.isInFocus) &&
                    this.props.currentUserId === this.props.creatorId &&
                    bulkSelectAnnotation &&
                    this.renderBulkSelectBtn()}
            </HighlightActionsBox>
        ) : null

        return (
            <ThemeProvider theme={this.theme}>
                <AnnotationBox
                    zIndex={this.props.zIndex}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                >
                    <ItemBox
                        firstDivProps={{
                            id: ANNOT_BOX_ID_PREFIX + this.props.unifiedId,
                        }}
                        hoverState={
                            this.props.isInFocus || this.state.hoverCard
                        }
                        onRef={this.itemBoxRef}
                    >
                        {this.renderDeleteScreen(footerDeps)}
                        <AnnotationStyled>
                            {!this.props.isEditing && (
                                <ActionBox>{actionsBox}</ActionBox>
                            )}
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
                            {(this.creationInfo?.createdWhen &&
                                !this.props.isEditing) ||
                            this.displayLists.length >= 1 ? (
                                <DateAndSpaces
                                    inSidebar={
                                        this.props.contextLocation === 'in-page'
                                    }
                                >
                                    {this.creationInfo?.createdWhen &&
                                        !this.props.isEditing && (
                                            <CreationInfoBox>
                                                <CreationInfo
                                                    {...this.creationInfo}
                                                />
                                            </CreationInfoBox>
                                        )}
                                    {this.displayLists.length >= 1 && (
                                        <ListSegmentBox>
                                            {this.renderAutoAddedIndicator()}
                                            <ListsSegment
                                                tabIndex={0}
                                                lists={this.displayLists}
                                                onMouseEnter={
                                                    this.props.onListsHover
                                                }
                                                onListClick={
                                                    this.props.onListClick
                                                }
                                                onEditBtnClick={() => null}
                                                spacePickerButtonRef={
                                                    this
                                                        .spacePickerBodyButtonRef
                                                }
                                                padding={
                                                    this.props.isEditing
                                                        ? '0px'
                                                        : '0px'
                                                }
                                                removeSpaceForAnnotation={
                                                    this.props
                                                        .removeSpaceFromEditorPicker
                                                }
                                            />
                                        </ListSegmentBox>
                                    )}
                                </DateAndSpaces>
                            ) : null}
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

const ListSegmentBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    grid-gap: 10px;
    /* padding: 0px 15px; */
`

const DateAndSpaces = styled.div<{
    inSidebar: boolean
}>`
    display: flex;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
    flex-direction: column-reverse;
    align-items: flex-start;
    padding: 10px 15px 10px 15px;
    grid-gap: 10px;
`

const DeleteScreenContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: fill-available;
    width: fill-available;
    background: ${(props) => props.theme.colors.black}95;
    backdrop-filter: blur(5px);
    animation: increaseBlur 0.3s forwards;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10000000;
    border-radius: 10px;

    @keyframes increaseBlur {
        from {
            backdrop-filter: blur(5px);
        }
        to {
            backdrop-filter: blur(10px);
        }
    }
`

const fadeInUpAnimation = keyframes`
    to {
        opacity: 1;
        transform: translateY(0);
    }
`

const fadeInUp = css`
    opacity: 0;
    transform: translateY(15px);
    animation: ${fadeInUpAnimation} 0.2s ease-out forwards;
`
const DeleteScreenTitle = styled.div`
    font-size: 20px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
    margin-bottom: 20px;
    padding: 0 20px;
    line-height: 30px;
    font-weight: 600;
    letter-spacing: 0.5px;
    animation-delay: 0.15s;
    ${fadeInUp}
`

const DeleteScreenButtons = styled.div`
    display: flex;
    grid-gap: 10px;
    ${fadeInUp}
`

const HighlightSection = styled.div`
    display: flex;
    margin-top: 5px;
`

const ShareMenuContainer = styled.div`
    display: flex;
`

const Highlightbar = styled.div<{ barColor: string }>`
    background: ${(props) => props.theme.colors.prime1};
    border-radius: 2px;
    width: 5px;
    margin: 10px 10px 10px 0px;
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
    margin-right: 6px;
    color: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.white
            : props.theme.colors.black};
`

const AnnotationEditContainer = styled.div<{
    hasHighlight: boolean
    isEditing: boolean
}>`
    margin-top: ${(props) => !props.hasHighlight && '5px'};
    margin-bottom: ${(props) => props.isEditing && '5px'};
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

const slideInFromBottom = keyframes`
  from {
    margin-top: -10px;
  }
  to {
    margin-top: 0px;
    opacity: 1;
  }
`

const DefaultFooterStyled = styled.div<{
    compactVersion: boolean
    inFocus: boolean
    inPageMode?: boolean
    inEditMode?: boolean
    isShown?: boolean
}>`
    display: none;
    bottom: 0px;
    align-items: center;
    justify-content: space-between;
    z-index: 1000000;
    padding: 0 10px 0px 10px;
    box-sizing: border-box;
    border-radius: 0 0 12px 12px;
    position: relative;
    background: ${(props) => props.theme.colors.black0}98;
    backdrop-filter: blur(5px);
    width: 100%;
    opacity: 0;

    ${(props) =>
        props.inFocus &&
        css`
            animation: ${slideInFromBottom} 0.1
                cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
            position: relative;
            display: flex;
            opacity: 1;
        `};

    ${(props) =>
        props.inEditMode &&
        css`
            animation: ${slideInFromBottom} 0.1
                cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
            display: flex;
            position: relative;
            opacity: 1;
        `}
    ${(props) =>
        props.isShown &&
        css`
            animation: ${slideInFromBottom} 0.1
                cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
            display: flex;
            opacity: 1;
        `}
    ${(props) =>
        props.inPageMode &&
        css`
            backdrop-filter: unset;
            background: transparent;
        `};
`
const ActionFooterStyled = styled(DefaultFooterStyled)`
    padding: 0 0px 0px 0px;
    position: absolute;
    bottom: 0;
    background: ${(props) => props.theme.colors.black0};
`

const HighlightActionsBox = styled.div<{}>`
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

    & * {
        cursor: pointer;
    }
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
    z-index: 100000;
    position: absolute;
    right: 15px;
    top: 15px;
`

const HighlightStyled = styled.div<{ hasComment: boolean }>`
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;
    margin: 0;
    padding: 0px 10px 0px 15px;
    line-height: 20px;
    text-align: left;
    grid-gap: 2px;
    line-break: normal;
    display: flex;
    position: relative;
    flex-direction: column;
    ${(props) =>
        props.hasComment &&
        css`
            padding: 0px 10px 0px 15px;
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

const AnnotationStyled = styled.div<{}>`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    cursor: pointer;
    border-radius: inherit;

    background: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.greyScale1
            : props.theme.colors.greyScale3}96;
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
            grid-gap: 10px;
            padding-top: 5px;
        `}
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

const NotesCounterContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: fill-available;
    position: relative;
`

const NotesCounterTitle = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
`

const NoteCounter = styled.span`
    color: ${(props) => props.theme.colors.prime1};
    font-weight: 400;
    font-size: 14px;
    text-align: center;
`

const AutoAddedIndicator = styled.div`
    z-index: 1000;
`
const AutoAddDefaultContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    grid-gap: 15px;
`

const DefaultCheckBoxContainer = styled.div`
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale2};
    height: 20px;
    padding: 15px 15px 15px 15px;
`

const KeyboardShortCutBox = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 10px;
    padding: 15px 5px;
    align-items: center;
    height: 30px;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale2};
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    grid-gap: 15px;
`
const TooltipTextBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    grid-gap: 5px;
    justify-content: center;
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 14px;
    text-align: center;
    grid-gap: 10px;
    padding: 15px 15px 8px 15px;
`

const CreationInfoBox = styled.div`
    display: flex;
`

const BulkSelectButtonBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
`
