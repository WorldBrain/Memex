import React, { Component, createRef, KeyboardEventHandler } from 'react'
import qs from 'query-string'
import styled, { createGlobalStyle, css, keyframes } from 'styled-components'
import browser from 'webextension-polyfill'

import moment from 'moment'
import extractQueryFilters from 'src/util/nlp-time-filter'
import {
    shortcuts,
    ShortcutElData,
} from 'src/options/settings/keyboard-shortcuts'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import type {
    Shortcut,
    BaseKeyboardShortcuts,
} from 'src/in-page-ui/keyboard-shortcuts/types'
import { HighlightInteractionsInterface } from 'src/highlighting/types'
import { RibbonSubcomponentProps, RibbonHighlightsProps } from './types'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import AnnotationCreate from 'src/annotations/components/AnnotationCreate'
import BlurredSidebarOverlay from 'src/in-page-ui/sidebar/react/components/blurred-overlay'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { FeedActivityDot } from 'src/activity-indicator/ui'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import type { ListDetailsGetter } from 'src/annotations/types'
import FeedPanel from './feed-panel'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { addUrlToBlacklist } from 'src/blacklist/utils'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { HexColorPicker } from 'react-colorful'
import {
    DEFAULT_HIGHLIGHT_COLOR,
    HIGHLIGHT_COLOR_KEY,
} from 'src/highlighting/constants'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { BlockCounterIndicator } from 'src/util/subscriptions/counterIndicator'

export interface Props extends RibbonSubcomponentProps {
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    setRef?: (el: HTMLElement) => void
    isExpanded: boolean
    isRibbonEnabled: boolean
    shortcutsData: ShortcutElData[]
    showExtraButtons: boolean
    showTutorial: boolean
    getListDetailsById: ListDetailsGetter
    toggleShowExtraButtons: () => void
    toggleShowTutorial: () => void
    handleRibbonToggle: () => void
    handleRemoveRibbon: () => void
    highlighter: Pick<HighlightInteractionsInterface, 'resetHighlightsStyles'>
    hideOnMouseLeave?: boolean
    toggleFeed: () => void
    showFeed: boolean
}

interface State {
    shortcutsReady: boolean
    blockListValue: string
    showColorPicker: boolean
    renderFeedback: boolean
    pickerColor: string
    showPickerSave: boolean
    renderLiveChat: boolean
    renderChangeLog: boolean
}

export default class Ribbon extends Component<Props, State> {
    static defaultProps: Pick<Props, 'shortcutsData'> = {
        shortcutsData: shortcuts,
    }

    private keyboardShortcuts: BaseKeyboardShortcuts
    private shortcutsData: Map<string, ShortcutElData>
    private openOverviewTabRPC
    private openOptionsTabRPC
    getFeedInfo
    settingsButtonRef
    private annotationCreateRef // TODO: Figure out how to properly type refs to onClickOutside HOCs

    private spacePickerRef = createRef<HTMLDivElement>()
    private bookmarkButtonRef = createRef<HTMLDivElement>()

    private tutorialButtonRef = createRef<HTMLDivElement>()
    private feedButtonRef = createRef<HTMLDivElement>()
    private sidebarButtonRef = createRef<HTMLDivElement>()
    private changeColorRef = createRef<HTMLDivElement>()
    private colorPickerField = createRef<HTMLInputElement>()

    state: State = {
        shortcutsReady: false,
        blockListValue: this.getDomain(window.location.href),
        showColorPicker: false,
        showPickerSave: false,
        renderFeedback: false,
        pickerColor: DEFAULT_HIGHLIGHT_COLOR,
        renderLiveChat: false,
        renderChangeLog: false,
    }

    constructor(props: Props) {
        super(props)
        this.shortcutsData = new Map(
            props.shortcutsData.map((s) => [s.name, s]) as [
                string,
                ShortcutElData,
            ][],
        )
        this.openOverviewTabRPC = this.props.getRemoteFunction(
            'openOverviewTab',
        )
        this.openOptionsTabRPC = this.props.getRemoteFunction('openOptionsTab')
        this.getFeedInfo = this.props.getRemoteFunction('getFeedInfo')

        this.settingsButtonRef = createRef<HTMLDivElement>()
    }

    async componentDidMount() {
        this.keyboardShortcuts = await getKeyboardShortcutsState()
        this.setState(() => ({ shortcutsReady: true }))
        await this.initialiseHighlightColor()
    }

    async initialiseHighlightColor() {
        const {
            [HIGHLIGHT_COLOR_KEY]: highlightsColor,
        } = await browser.storage.local.get({
            [HIGHLIGHT_COLOR_KEY]: DEFAULT_HIGHLIGHT_COLOR,
        })
        this.setState({ pickerColor: highlightsColor })
    }

    updatePickerColor(value) {
        this.setState({
            pickerColor: value,
            showPickerSave: true,
        })

        let highlights: HTMLCollection = document.getElementsByTagName(
            'hypothesis-highlight',
        )

        for (let item of highlights) {
            item.setAttribute('style', `background-color:${value};`)
        }
    }

    async saveHighlightColor() {
        this.setState({
            showPickerSave: false,
        })
        await browser.storage.local.set({
            [HIGHLIGHT_COLOR_KEY]: this.state.pickerColor,
        })
    }

    focusCreateForm = () => this.annotationCreateRef?.getInstance()?.focus()

    private handleSearchEnterPress: KeyboardEventHandler<HTMLInputElement> = (
        event,
    ) => {
        const queryFilters = extractQueryFilters(this.props.search.searchValue)
        const queryParams = qs.stringify(queryFilters)

        this.openOverviewTabRPC(queryParams)
        this.props.search.setShowSearchBox(false)
        this.props.search.setSearchValue('')
    }

    private handleCommentIconBtnClick = (event) => {
        if (event.shiftKey) {
            if (this.props.sidebar.isSidebarOpen) {
                this.props.sidebar.setShowSidebarCommentBox(true)
                return
            }
            this.props.commentBox.setShowCommentBox(
                !this.props.commentBox.showCommentBox,
            )
        } else {
            this.props.sidebar.openSidebar({})
        }
    }

    private getTooltipText(name: string): JSX.Element | string {
        const elData = this.shortcutsData.get(name)
        const short: Shortcut = this.keyboardShortcuts[name]

        if (!elData) {
            return ''
        }

        let source = elData.tooltip

        if (['createBookmark', 'toggleSidebar'].includes(name)) {
            source = this.props.bookmark.isBookmarked
                ? elData.toggleOff
                : elData.toggleOn
        }

        return short.shortcut && short.enabled ? (
            <TooltipContent>
                {source}
                {
                    <KeyboardShortcuts
                        size={'small'}
                        keys={short.shortcut.split('+')}
                    />
                }
            </TooltipContent>
        ) : (
            source
        )
    }

    private hideListPicker = () => {
        this.props.lists.setShowListsPicker(false)
    }

    private renderSpacePicker() {
        if (!this.props.lists.showListsPicker) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.spacePickerRef.current}
                placement={'left-start'}
                offsetX={10}
                closeComponent={this.hideListPicker}
            >
                <CollectionPicker
                    {...this.props.lists}
                    spacesBG={this.props.spacesBG}
                    contentSharingBG={this.props.contentSharingBG}
                    actOnAllTabs={this.props.lists.listAllTabs}
                    initialSelectedListIds={
                        this.props.lists.fetchInitialListSelections
                    }
                    closePicker={this.hideListPicker}
                    onListShare={this.props.onListShare}
                />
            </PopoutBox>
        )
    }

    private renderTutorial() {
        if (!this.props.showTutorial) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.tutorialButtonRef.current}
                placement={
                    this.props.sidebar.isSidebarOpen ? 'left-end' : 'left'
                }
                offsetX={10}
                closeComponent={this.props.toggleShowTutorial}
                width={'440px'}
            >
                <QuickTutorial
                    getKeyboardShortcutsState={getKeyboardShortcutsState}
                    onSettingsClick={() => this.openOptionsTabRPC('settings')}
                />
            </PopoutBox>
        )
    }

    private renderColorPicker() {
        if (!this.state.showColorPicker) {
            return
        }

        return (
            <ColorPickerContainer>
                <PickerButtonTopBar>
                    <PrimaryAction
                        size={'small'}
                        icon={'arrowLeft'}
                        label={'Go back'}
                        type={'tertiary'}
                        onClick={() =>
                            this.setState({
                                showColorPicker: false,
                            })
                        }
                    />
                    {this.state.showPickerSave ? (
                        <PrimaryAction
                            size={'small'}
                            label={'Save Color'}
                            type={'primary'}
                            onClick={() => this.saveHighlightColor()}
                        />
                    ) : undefined}
                </PickerButtonTopBar>
                <TextField
                    value={this.state.pickerColor}
                    onChange={(event) =>
                        this.updatePickerColor(
                            (event.target as HTMLInputElement).value,
                        )
                    }
                    componentRef={this.colorPickerField}
                />
                <HexPickerContainer>
                    <HexColorPicker
                        color={this.state.pickerColor}
                        onChange={(value) => {
                            this.setState({
                                pickerColor: value,
                            })
                            this.updatePickerColor(value)
                        }}
                    />
                </HexPickerContainer>
            </ColorPickerContainer>
        )
    }

    private whichFeed = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.social/feed'
        } else {
            return 'https://staging.memex.social/feed'
        }
    }

    renderFeedInfo() {
        if (!this.props.showFeed) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.feedButtonRef.current}
                placement={'left-start'}
                offsetX={0}
                offsetY={-15}
                width={'630px'}
                closeComponent={() => this.props.toggleFeed()}
            >
                <FeedContainer>
                    <TitleContainer>
                        <Icon heightAndWidth="22px" filePath="feed" hoverOff />
                        <TitleContent>
                            <SectionTitle>Activity Feed</SectionTitle>
                            <SectionDescription>
                                Updates from Spaces and conversation you follow
                                or contributed to.
                            </SectionDescription>
                        </TitleContent>
                    </TitleContainer>
                    <FeedFrame src={this.whichFeed()} />
                </FeedContainer>
            </PopoutBox>
        )
    }

    private getDomain(url: string) {
        const withoutProtocol = url.split('//')[1]

        if (withoutProtocol.startsWith('www.')) {
            return withoutProtocol.split('www.')[1].split('/')[0]
        } else {
            return withoutProtocol.split('/')[0]
        }
    }

    renderLiveChat() {}

    private renderExtraButtons() {
        if (!this.props.showExtraButtons) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.settingsButtonRef.current}
                placement={
                    this.props.sidebar.isSidebarOpen ? 'left-end' : 'left-start'
                }
                offsetX={10}
                width={!this.state.showColorPicker ? '360px' : '500px'}
                closeComponent={() => {
                    this.setState({
                        showColorPicker: false,
                        renderFeedback: false,
                        renderLiveChat: false,
                        renderChangeLog: false,
                    })
                    this.props.toggleShowExtraButtons()
                }}
            >
                <GlobalStyle />
                {this.state.showColorPicker ? (
                    this.renderColorPicker()
                ) : this.state.renderFeedback ? (
                    <FeedbackContainer>
                        <LoadingIndicator size={30} />
                        <FeedFrame
                            src="https://memex.featurebase.app"
                            frameborder="0"
                            onmousewheel=""
                            width="100%"
                            height="533"
                        />
                    </FeedbackContainer>
                ) : this.state.renderLiveChat ? (
                    <ChatBox>
                        <LoadingIndicator size={30} />
                        <ChatFrame
                            src={
                                'https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599'
                            }
                            height={600}
                            width={500}
                        />
                    </ChatBox>
                ) : this.state.renderChangeLog ? (
                    <ChatBox>
                        <LoadingIndicator size={30} />
                        <ChatFrame
                            src={'https://memex.featurebase.app/changelog'}
                            height={600}
                            width={500}
                        />
                    </ChatBox>
                ) : (
                    <ExtraButtonContainer>
                        <BlockListArea>
                            <BlockListTitleArea>
                                <BlockListTitleContent>
                                    <Icon
                                        filePath={'block'}
                                        heightAndWidth="22px"
                                        hoverOff
                                    />
                                    <InfoText>
                                        Block List for Action Sidebar
                                    </InfoText>
                                </BlockListTitleContent>
                                <TooltipBox
                                    tooltipText={'Modify existing block list'}
                                    placement={'bottom'}
                                >
                                    <Icon
                                        onClick={() =>
                                            this.openOptionsTabRPC('blocklist')
                                        }
                                        filePath={'settings'}
                                        heightAndWidth={'18px'}
                                        color={'prime1'}
                                    />
                                </TooltipBox>
                            </BlockListTitleArea>
                            <TextBoxArea>
                                <TextField
                                    value={this.state.blockListValue}
                                    onChange={(event) =>
                                        this.setState({
                                            blockListValue: (event.target as HTMLInputElement)
                                                .value,
                                        })
                                    }
                                    width="fill-available"
                                />
                                <TooltipBox
                                    tooltipText={
                                        'Add this entry to the block list'
                                    }
                                    placement={'bottom'}
                                >
                                    <Icon
                                        heightAndWidth="22px"
                                        filePath="plus"
                                        color="prime1"
                                        onClick={async () => {
                                            this.setState({
                                                blockListValue:
                                                    'Added to block list',
                                            })
                                            await addUrlToBlacklist(
                                                this.state.blockListValue,
                                            )
                                            setTimeout(
                                                () =>
                                                    this.props.handleRemoveRibbon(),
                                                2000,
                                            )
                                        }}
                                    />
                                </TooltipBox>
                            </TextBoxArea>
                        </BlockListArea>
                        <ExtraButtonRow
                            onClick={() => {
                                this.props.handleRibbonToggle()
                                this.props.sidebar.closeSidebar()
                            }}
                        >
                            <Icon
                                filePath={icons.quickActionRibbon}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            {this.props.isRibbonEnabled ? (
                                <InfoText>
                                    Disable Action Sidebar on all pages
                                </InfoText>
                            ) : (
                                <InfoText>
                                    Enable Action Sidebar on all pages
                                </InfoText>
                            )}
                        </ExtraButtonRow>
                        <ExtraButtonRow
                            onClick={(event) => {
                                this.setState({
                                    showColorPicker: true,
                                })
                                event.stopPropagation()
                            }}
                        >
                            <ColorPickerCircle
                                backgroundColor={this.state.pickerColor}
                            />
                            <InfoText>Change Highlight Color</InfoText>
                        </ExtraButtonRow>
                        {/* <ExtraButtonRow
                            onClick={
                                this.props.highlights.handleHighlightsToggle
                            }
                        >
                            <Icon
                                filePath={'highlight'}
                                heightAndWidth="22px"
                                hoverOff
                                color={
                                    this.props.highlights
                                        .areHighlightsEnabled && 'prime1'
                                }
                            />
                            {this.props.highlights.areHighlightsEnabled ? (
                                <InfoText>Hide Highlights</InfoText>
                            ) : (
                                <InfoText>Show Highlights</InfoText>
                            )}
                        </ExtraButtonRow> */}

                        <ExtraButtonRow
                            onClick={this.props.tooltip.handleTooltipToggle}
                        >
                            <Icon
                                filePath={
                                    this.props.tooltip.isTooltipEnabled
                                        ? icons.tooltipOff
                                        : icons.tooltipOn
                                }
                                heightAndWidth="22px"
                                hoverOff
                            />
                            {this.props.tooltip.isTooltipEnabled ? (
                                <InfoText>Hide Highlighter Tooltip</InfoText>
                            ) : (
                                <InfoText>Show Highlighter Tooltip</InfoText>
                            )}
                        </ExtraButtonRow>
                        <ExtraButtonRow
                            onClick={() =>
                                window.open('https://worldbrain.io/tutorials')
                            }
                        >
                            <Icon
                                filePath={icons.helpIcon}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            <InfoText>Tutorials</InfoText>
                        </ExtraButtonRow>
                        <ExtraButtonRow
                            onClick={() => this.openOptionsTabRPC('settings')}
                        >
                            <Icon
                                filePath={icons.settings}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            <InfoText>Settings</InfoText>
                        </ExtraButtonRow>
                        <SupportTitle>Support</SupportTitle>
                        <ExtraButtonRow
                            onClick={() =>
                                this.setState({
                                    renderFeedback: true,
                                })
                            }
                        >
                            <Icon
                                filePath={icons.sadFace}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            <InfoText>Feature Requests & Bugs</InfoText>
                        </ExtraButtonRow>
                        <ExtraButtonRow
                            onClick={() =>
                                this.setState({
                                    renderChangeLog: true,
                                })
                            }
                        >
                            <Icon
                                filePath={icons.clock}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            <InfoText>What's new?</InfoText>
                        </ExtraButtonRow>
                        <ExtraButtonRow
                            onClick={() =>
                                this.setState({
                                    renderLiveChat: true,
                                })
                            }
                        >
                            <Icon
                                filePath={icons.chatWithUs}
                                heightAndWidth="22px"
                                hoverOff
                            />
                            <InfoText>Live Chat Support</InfoText>
                        </ExtraButtonRow>
                    </ExtraButtonContainer>
                )}
            </PopoutBox>
        )
    }

    renderCommentBox() {
        if (!this.props.commentBox.showCommentBox) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.sidebarButtonRef.current}
                placement={'left-start'}
                offsetX={10}
            >
                <CommentBoxContainer
                    hasComment={this.props.commentBox.commentText.length > 0}
                >
                    <AnnotationCreate
                        ref={(ref) => (this.annotationCreateRef = ref)}
                        hide={() =>
                            this.props.commentBox.setShowCommentBox(false)
                        }
                        onSave={this.props.commentBox.saveComment}
                        onCancel={this.props.commentBox.cancelComment}
                        onCommentChange={this.props.commentBox.changeComment}
                        comment={this.props.commentBox.commentText}
                        lists={this.props.commentBox.lists}
                        getListDetailsById={this.props.getListDetailsById}
                        createNewList={this.props.lists.createNewEntry}
                        addPageToList={this.props.lists.selectEntry}
                        removePageFromList={this.props.lists.unselectEntry}
                        isRibbonCommentBox
                        spacesBG={this.props.spacesBG}
                        contentSharingBG={this.props.contentSharingBG}
                        autoFocus
                    />
                </CommentBoxContainer>
            </PopoutBox>
        )
    }

    render() {
        if (!this.state.shortcutsReady) {
            return false
        }

        let bookmarkDate
        if (this.props.bookmark.isBookmarked != null) {
            bookmarkDate = moment(
                new Date(this.props.bookmark.lastBookmarkTimestamp),
            ).format('LLL')
        }

        return (
            <>
                <OuterRibbon
                    isPeeking={this.props.isExpanded}
                    isSidebarOpen={this.props.sidebar.isSidebarOpen}
                >
                    <InnerRibbon
                        ref={this.props.setRef}
                        isPeeking={this.props.isExpanded}
                        isSidebarOpen={this.props.sidebar.isSidebarOpen}
                    >
                        {(this.props.isExpanded ||
                            this.props.sidebar.isSidebarOpen) && (
                            <>
                                <UpperPart>
                                    {!this.props.sidebar.isSidebarOpen && (
                                        <>
                                            <TooltipBox
                                                targetElementRef={
                                                    this.feedButtonRef.current
                                                }
                                                tooltipText={'Show Feed'}
                                                placement={'left'}
                                                offsetX={0}
                                            >
                                                <FeedIndicatorBox
                                                    isSidebarOpen={
                                                        this.props.sidebar
                                                            .isSidebarOpen
                                                    }
                                                    onClick={() =>
                                                        this.props.toggleFeed()
                                                    }
                                                    ref={this.feedButtonRef}
                                                >
                                                    <FeedActivityDot
                                                        key="activity-feed-indicator"
                                                        {...this.props
                                                            .activityIndicator}
                                                    />
                                                </FeedIndicatorBox>
                                            </TooltipBox>
                                            <HorizontalLine
                                                sidebaropen={
                                                    this.props.sidebar
                                                        .isSidebarOpen
                                                }
                                            />
                                        </>
                                    )}
                                    <PageAction>
                                        {this.props.sidebar.isSidebarOpen && (
                                            <UpperArea>
                                                <TooltipBox
                                                    targetElementRef={
                                                        this.feedButtonRef
                                                            .current
                                                    }
                                                    tooltipText={
                                                        <TooltipContent>
                                                            Close{' '}
                                                            <KeyboardShortcuts
                                                                keys={['Esc']}
                                                                size="small"
                                                            />
                                                        </TooltipContent>
                                                    }
                                                    placement={'left'}
                                                    offsetX={0}
                                                >
                                                    <Icon
                                                        filePath="removeX"
                                                        heightAndWidth="20px"
                                                        color="greyScale6"
                                                        onClick={() =>
                                                            this.props.sidebar.closeSidebar()
                                                        }
                                                    />
                                                </TooltipBox>
                                                {this.props.sidebar
                                                    .isSidebarOpen ? (
                                                    !this.props.sidebar
                                                        .isWidthLocked ? (
                                                        <TooltipBox
                                                            tooltipText="Side-by-Side Reading"
                                                            placement="left"
                                                        >
                                                            <Icon
                                                                filePath={
                                                                    icons.sideBySide
                                                                }
                                                                heightAndWidth="20px"
                                                                color={
                                                                    'greyScale6'
                                                                }
                                                                onClick={() =>
                                                                    this.props.sidebar.toggleReadingView()
                                                                }
                                                            />
                                                        </TooltipBox>
                                                    ) : (
                                                        <TooltipBox
                                                            tooltipText="Full Page Reading"
                                                            placement="left"
                                                        >
                                                            <Icon
                                                                filePath={
                                                                    icons.fullPageReading
                                                                }
                                                                heightAndWidth="20px"
                                                                color={
                                                                    'greyScale6'
                                                                }
                                                                onClick={() =>
                                                                    this.props.sidebar.toggleReadingView()
                                                                }
                                                            />
                                                        </TooltipBox>
                                                    )
                                                ) : undefined}
                                                <HorizontalLine
                                                    sidebaropen={
                                                        this.props.sidebar
                                                            .isSidebarOpen
                                                    }
                                                />
                                            </UpperArea>
                                        )}
                                        <TooltipBox
                                            tooltipText={
                                                this.props.bookmark
                                                    .isBookmarked ? (
                                                    <span>
                                                        Bookmarked on{' '}
                                                        <DateText>
                                                            {bookmarkDate}
                                                        </DateText>
                                                    </span>
                                                ) : (
                                                    this.getTooltipText(
                                                        'createBookmark',
                                                    )
                                                )
                                            }
                                            placement={'left'}
                                            offsetX={10}
                                        >
                                            <Icon
                                                onClick={() =>
                                                    this.props.bookmark.toggleBookmark()
                                                }
                                                color={
                                                    this.props.bookmark
                                                        .isBookmarked
                                                        ? 'prime1'
                                                        : 'greyScale6'
                                                }
                                                heightAndWidth="20px"
                                                filePath={
                                                    this.props.bookmark
                                                        .isBookmarked
                                                        ? icons.heartFull
                                                        : icons.heartEmpty
                                                }
                                            />
                                        </TooltipBox>
                                        <TooltipBox
                                            tooltipText={this.getTooltipText(
                                                'addToCollection',
                                            )}
                                            placement={'left'}
                                            offsetX={10}
                                        >
                                            <Icon
                                                onClick={() =>
                                                    this.props.lists.setShowListsPicker(
                                                        !this.props.lists
                                                            .showListsPicker,
                                                    )
                                                }
                                                color={
                                                    this.props.lists.pageListIds
                                                        .length > 0
                                                        ? 'prime1'
                                                        : 'greyScale6'
                                                }
                                                heightAndWidth="20px"
                                                filePath={
                                                    this.props.lists.pageListIds
                                                        .length > 0
                                                        ? icons.collectionsFull
                                                        : icons.collectionsEmpty
                                                }
                                                containerRef={
                                                    this.spacePickerRef
                                                }
                                            />
                                        </TooltipBox>
                                        {!this.props.sidebar.isSidebarOpen && (
                                            <TooltipBox
                                                targetElementRef={
                                                    this.sidebarButtonRef
                                                        .current
                                                }
                                                tooltipText={this.getTooltipText(
                                                    'toggleSidebar',
                                                )}
                                                placement={'left'}
                                                offsetX={10}
                                            >
                                                <Icon
                                                    onClick={(e) =>
                                                        this.handleCommentIconBtnClick(
                                                            e,
                                                        )
                                                    }
                                                    color={'greyScale6'}
                                                    heightAndWidth="20px"
                                                    filePath={
                                                        this.props.commentBox
                                                            .isCommentSaved
                                                            ? icons.saveIcon
                                                            : // : this.props.hasAnnotations
                                                              // ? icons.commentFull
                                                              icons.commentAdd
                                                    }
                                                    containerRef={
                                                        this.sidebarButtonRef
                                                    }
                                                />
                                            </TooltipBox>
                                        )}
                                        <TooltipBox
                                            tooltipText={this.getTooltipText(
                                                'openDashboard',
                                            )}
                                            placement={'left'}
                                            offsetX={10}
                                        >
                                            <Icon
                                                onClick={() =>
                                                    this.openOverviewTabRPC()
                                                }
                                                color={'greyScale6'}
                                                heightAndWidth="20px"
                                                filePath={icons.searchIcon}
                                            />
                                        </TooltipBox>
                                    </PageAction>
                                </UpperPart>
                                {!this.props.sidebar.isSidebarOpen && (
                                    <HorizontalLine
                                        sidebaropen={
                                            this.props.sidebar.isSidebarOpen
                                        }
                                    />
                                )}
                                <BottomSection
                                    sidebaropen={
                                        this.props.sidebar.isSidebarOpen
                                    }
                                >
                                    <BlockCounterIndicator />
                                    <Icon
                                        onClick={() =>
                                            this.props.toggleShowExtraButtons()
                                        }
                                        color={'greyScale5'}
                                        heightAndWidth="22px"
                                        filePath={icons.settings}
                                        containerRef={this.settingsButtonRef}
                                    />
                                    <TooltipBox
                                        tooltipText={
                                            <span>
                                                Keyboard Shortcuts
                                                <br />
                                                and Help
                                            </span>
                                        }
                                        placement={'left'}
                                        offsetX={10}
                                    >
                                        <Icon
                                            onClick={() =>
                                                this.props.toggleShowTutorial()
                                            }
                                            color={'greyScale5'}
                                            heightAndWidth="22px"
                                            filePath={icons.helpIcon}
                                            containerRef={
                                                this.tutorialButtonRef
                                            }
                                        />
                                    </TooltipBox>
                                    {!this.props.sidebar.isSidebarOpen && (
                                        <TooltipBox
                                            tooltipText={
                                                <span>
                                                    Close sidebar this once.
                                                    <br />
                                                    <SubText>
                                                        Shift+Click to disable.
                                                    </SubText>
                                                </span>
                                            }
                                            placement={'left'}
                                            offsetX={10}
                                        >
                                            <Icon
                                                onClick={(event) => {
                                                    if (
                                                        event.shiftKey &&
                                                        this.props
                                                            .isRibbonEnabled
                                                    ) {
                                                        this.props.handleRibbonToggle()
                                                    } else {
                                                        this.props.handleRemoveRibbon()
                                                    }
                                                }}
                                                color={'greyScale5'}
                                                heightAndWidth="22px"
                                                filePath={icons.removeX}
                                            />
                                        </TooltipBox>
                                    )}
                                </BottomSection>
                            </>
                        )}
                    </InnerRibbon>
                </OuterRibbon>
                {this.renderSpacePicker()}
                {this.renderTutorial()}
                {this.renderFeedInfo()}
                {this.renderCommentBox()}
                {this.renderExtraButtons()}
            </>
        )
    }
}

const SupportTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 16px;
    margin: 15px 0 5px 15px;
`

const ChatBox = styled.div`
    position: relative;
    height: 600px;
    width: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
`
const ChatFrame = styled.iframe`
    border: none;
    border-radius: 12px;
    position: absolute;
    top: 0px;
    left: 0px;
`

const DateText = styled.span`
    color: ${(props) => props.theme.colors.white};
`

const ColorPickerCircle = styled.div<{ backgroundColor: string }>`
    height: 18px;
    width: 18px;
    background-color: ${(props) => props.backgroundColor};
    border-radius: 50px;
    margin: 5px;
`

const UpperArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    grid-gap: 8px;
`

const ButtonPositioning = styled.div`
    position: absolute;
    right: 15px;
`

const PickerButtonTopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: fill-available;
    margin-left: -7px;
`

const ExtraButtonContainer = styled.div`
    padding: 10px;
    width: 300px;
`
const ColorPickerContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    padding: 10px 15px 15px 15px;
    width: 200px;
`

const HexPickerContainer = styled.div`
    height: 200px;
    width: 200px;

    > * {
        width: initial;
    }
`

const TooltipContent = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    flex-direction: row;
    justify-content: center;
`

const BlockListArea = styled.div`
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    align-items: flex-start;
    margin-bottom: 5px;
    padding: 5px 10px 10px 0;
`

const BlockListTitleArea = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    padding: 0px 0px 5px 15px;
    justify-content: space-between;
    width: fill-available;
    z-index: 1;
`

const BlockListTitleContent = styled.div`
    display: flex;
    justify-content: flex-start;
    grid-gap: 10px;
    align-items: center;
`

const TextBoxArea = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
    width: fill-available;
    grid-gap: 5px;
`

const UpperPart = styled.div`
    width: fill-available;
`

const BottomSection = styled.div<{ sidebaropen: boolean }>`
    align-self: center;
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
`

const openAnimation = keyframes`
 0% { padding-bottom: 20px; opacity: 0 }
 100% { padding-bottom: 0px; opacity: 1 }
`

const OuterRibbon = styled.div<{ isPeeking; isSidebarOpen }>`
    flex-direction: column;
    justify-content: center;
    align-self: center;
    width: 24px;
    height: 400px;
    right: -40px;
    position: sticky;
    display: flex;
    /* box-shadow: -1px 2px 5px 0px rgba(0, 0, 0, 0.16); */
    line-height: normal;
    text-align: start;
    align-items: center;
    background: transparent;
    z-index: 2147483644;
    /* animation: slide-in ease-out;
    animation-duration: 0.05s; */

    ${(props) =>
        props.isPeeking &&
        css`
            display: flex;
            align-items: flex-end;
            width: 44px;
            padding-right: 25px;
            right: 0px;
            transition: all 0.1s cubic-bezier(0.4, 0, 0.16, 0.87);
        `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            display: flex;
            box-shadow: none;
            justify-content: center;
            height: 100vh;
            width: 28px;
            align-items: flex-start;
            padding: 0 7px 0 5px;
            right: 0px;
            background: ${(props) => props.theme.colors.black};
            transition: unset;

            & .removeSidebar {
                visibility: hidden;
                display: none;
            }
        `}
`

const InnerRibbon = styled.div<{ isPeeking; isSidebarOpen }>`
    position: absolute;
    top: 20px;
    width: 44px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5px 0;
    display: none;
    background: ${(props) => props.theme.colors.greyScale1};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};

    ${(props) =>
        props.isPeeking &&
        css`
            border-radius: 8px;
            display: flex;
            box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
            background: ${(props) => props.theme.colors.greyScale1};
        }
    `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            display: flex;
            box-shadow: none;
            height: fill-available;
            top: 0px;
            width: 28px;
            justify-content: space-between;
            padding: 5px 0px;
            background: transparent;
            border: none;
            align-items: center;
            background: ${(props) => props.theme.colors.black};
        `}
`

const ExtraButtonRow = styled.div`
    height: 40px;
    display: flex;
    grid-gap: 10px;
    align-items: center;
    width: fill-available;
    cursor: pointer;
    border-radius: 3px;
    padding: 0 15px;
    position: relative;

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }
`

const HorizontalLine = styled.div<{ sidebaropen: boolean }>`
    width: 100%;
    margin: 5px 0;
    height: 1px;
    background-color: ${(props) => props.theme.colors.greyScale3};
`

const PageAction = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: row;
    align-items: center;
    justify-content: center;
    padding: 7px 10px 10px 10px;
`

const SubText = styled.span`
    font-size: 10px;
`

const FeedIndicatorBox = styled.div<{ isSidebarOpen: boolean }>`
    display: flex;
    justify-content: center;
    margin: ${(props) => (props.isSidebarOpen ? '2px 0 15px' : '10px 0')};
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    font-weight: 400;
`

const FeedFrame = styled.iframe`
    width: fill-available;
    height: 600px;
    border: none;
    border-radius: 10px;
    width: 500px;
`

const FeedbackContainer = styled.div`
    width: fill-available;
    height: 600px;
    border: none;
    border-radius: 10px;
    width: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    & > iframe {
        position: absolute;
        top: 0px;
        left: 0px;
    }
`

const FeedContainer = styled.div`
    display: flex;
    width: fill-available;
    height: 580px;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    padding-top: 20px;
    max-width: 800px;
    background: ${(props) => props.theme.colors.black};
    border-radius: 10px;
`

const TitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 15px;
    width: fill-available;
    padding: 0 20px 20px 20px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
`
const TitleContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    grid-gap: 10px;
    width: fill-available;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 18px;
    font-weight: bold;
`
const SectionDescription = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
`
const CommentBoxContainer = styled.div<{ hasComment: boolean }>`
    padding: 5px 5px;
    width: 350px;

    & > div {
        margin: 0;

        & > div:first-child {
            margin: ${(props) => (props.hasComment ? '0 0 10px 0' : '0')};
        }
    }
`

export const GlobalStyle = createGlobalStyle`

.react-colorful {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 200px;
    height: 200px;
    user-select: none;
    cursor: default;
  }

  .react-colorful__saturation {
    position: relative;
    flex-grow: 1;
    border-color: transparent; /* Fixes https://github.com/omgovich/react-colorful/issues/139 */
    border-bottom: 12px solid #000;
    border-radius: 8px 8px 0 0;
    background-image: linear-gradient(to top, #000, rgba(0, 0, 0, 0)),
      linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
  }

  .react-colorful__pointer-fill,
  .react-colorful__alpha-gradient {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    border-radius: inherit;
  }

  /* Improve elements rendering on light backgrounds */
  .react-colorful__alpha-gradient,
  .react-colorful__saturation {
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  }

  .react-colorful__hue,
  .react-colorful__alpha {
    position: relative;
    height: 24px;
  }

  .react-colorful__hue {
    background: linear-gradient(
      to right,
      #f00 0%,
      #ff0 17%,
      #0f0 33%,
      #0ff 50%,
      #00f 67%,
      #f0f 83%,
      #f00 100%
    );
  }

  .react-colorful__last-control {
    border-radius: 0 0 8px 8px;
  }

  .react-colorful__interactive {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    outline: none;
    /* Don't trigger the default scrolling behavior when the event is originating from this element */
    touch-action: none;
  }

  .react-colorful__pointer {
    position: absolute;
    z-index: 1;
    box-sizing: border-box;
    width: 28px;
    height: 28px;
    transform: translate(-50%, -50%);
    background-color: #fff;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .react-colorful__interactive:focus .react-colorful__pointer {
    transform: translate(-50%, -50%) scale(1.1);
  }

  /* Chessboard-like pattern for alpha related elements */
  .react-colorful__alpha,
  .react-colorful__alpha-pointer {
    background-color: #fff;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill-opacity=".05"><rect x="8" width="8" height="8"/><rect y="8" width="8" height="8"/></svg>');
  }

  /* Display the saturation pointer over the hue one */
  .react-colorful__saturation-pointer {
    z-index: 3;
  }

  /* Display the hue pointer over the alpha one */
  .react-colorful__hue-pointer {
    z-index: 2;
  }

`
