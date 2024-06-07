import React, { Component, createRef, KeyboardEventHandler } from 'react'
import styled, { createGlobalStyle, css, keyframes } from 'styled-components'
import browser from 'webextension-polyfill'

import moment from 'moment'
import {
    shortcuts,
    ShortcutElData,
} from 'src/options/settings/keyboard-shortcuts'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import type {
    Shortcut,
    BaseKeyboardShortcuts,
} from 'src/in-page-ui/keyboard-shortcuts/types'
import type { HighlightRendererInterface } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/types'
import { RibbonSubcomponentProps } from './types'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { FeedActivityDot } from 'src/activity-indicator/ui'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import type { ListDetailsGetter } from 'src/annotations/types'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { addUrlToBlacklist } from 'src/blacklist/utils'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { HexColorPicker, RgbaColorPicker } from 'react-colorful'
import { HIGHLIGHT_COLOR_KEY } from 'src/highlighting/constants'
import { DEFAULT_HIGHLIGHT_COLOR } from '@worldbrain/memex-common/lib/annotations/constants'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { BlockCounterIndicator } from 'src/util/subscriptions/pageCountIndicator'
import { READ_STORAGE_FLAG } from 'src/common-ui/containers/UpdateNotifBanner/constants'
import { logoNoText } from 'src/common-ui/components/design-library/icons'
import { getTelegramUserDisplayName } from '@worldbrain/memex-common/lib/telegram/utils'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import { RGBAColor, UnifiedList } from 'src/annotations/cache/types'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import { TOOLTIP_WIDTH } from '../../constants'
import type { RemoteBGScriptInterface } from 'src/background-script/types'
import { RGBAobjectToString } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/utils'
import { ErrorNotification } from '@worldbrain/memex-common/lib/common-ui/components/error-notification'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { isUrlYTVideo } from '@worldbrain/memex-common/lib/utils/youtube-url'
import { DEF_HIGHLIGHT_CSS_CLASS } from '@worldbrain/memex-common/lib/in-page-ui/highlighting/constants'
import { OverlayModals } from '@worldbrain/memex-common/lib/common-ui/components/overlay-modals'
import DeleteConfirmModal from 'src/overview/delete-confirm-modal/components/DeleteConfirmModal'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { renderNudgeTooltip } from 'src/util/nudges-utils'

export interface Props extends RibbonSubcomponentProps {
    currentUser: AuthenticatedUser
    setRef?: (el: HTMLElement) => void
    ribbonRef: React.RefObject<Ribbon>
    isExpanded: boolean
    theme: MemexThemeVariant
    isRibbonEnabled: boolean
    ribbonPosition: 'topRight' | 'bottomRight' | 'centerRight'
    shortcutsData: ShortcutElData[]
    showExtraButtons: boolean
    showRemoveMenu: boolean
    showTutorial: boolean
    getListDetailsById: ListDetailsGetter
    toggleShowExtraButtons: () => void
    toggleRemoveMenu: () => void
    toggleShowTutorial: () => void
    handleRibbonToggle: () => void
    handleRemoveRibbon: () => void
    highlighter: Pick<HighlightRendererInterface, 'resetHighlightsStyles'>
    hideOnMouseLeave?: boolean
    toggleFeed: () => void
    showFeed: boolean
    toggleAskAI: (instaExecute: boolean) => void
    showBookmarksNudge: boolean
    setShowBookmarksNudge: (value: boolean, snooze: boolean) => void
    toggleRabbitHole: () => void
    toggleQuickSearch: () => void
    openPDFinViewer: () => void
    selectRibbonPositionOption: (option) => void
    hasFeedActivity: boolean
    analyticsBG: AnalyticsCoreInterface
    isTrial: boolean
    signupDate?: number
    toggleTheme: () => void
    getRootElement: () => HTMLElement
    bgScriptBG: RemoteBGScriptInterface<'caller'>
    setWriteError: (error: string) => void
    showRabbitHoleButton: boolean
    tutorialIdToOpen: string
    setTutorialIdToOpen: (tutorialId: string) => void
    deletePage: () => void
    confirmDeletion: (promptConfirmation: boolean) => void
    events: AnnotationsSidebarInPageEventEmitter
    forceRibbonShow: (force: boolean) => void
}

interface State {
    shortcutsReady: boolean
    blockListValue: string
    renderFeedback: boolean
    pickerColor: RGBAColor
    renderLiveChat: boolean
    renderChangeLog: boolean
    updatesAvailable: boolean
    initialHighlightColor: RGBAColor
    hoverSavedButton: boolean
}

export default class Ribbon extends Component<Props, State> {
    static defaultProps: Pick<Props, 'shortcutsData'> = {
        shortcutsData: shortcuts,
    }

    private keyboardShortcuts: BaseKeyboardShortcuts
    private shortcutsData: Map<string, ShortcutElData>
    settingsButtonRef
    private annotationCreateRef // TODO: Figure out how to properly type refs to onClickOutside HOCs

    private spacePickerRef = createRef<HTMLDivElement>()
    private memexLogoRef = createRef<HTMLDivElement>()

    private tutorialButtonRef = createRef<HTMLDivElement>()
    private feedButtonRef = createRef<HTMLDivElement>()
    private sidebarButtonRef = createRef<HTMLDivElement>()
    private removeMenuButtonRef = createRef<HTMLDivElement>()

    static ALT_KEY =
        getKeyName({ key: 'alt' }).charAt(0).toUpperCase() +
        getKeyName({ key: 'alt' }).slice(1)

    state: State = {
        shortcutsReady: false,
        blockListValue: this.getDomain(window.location.href),
        renderFeedback: false,
        pickerColor: DEFAULT_HIGHLIGHT_COLOR,
        renderLiveChat: false,
        renderChangeLog: false,
        updatesAvailable: false,
        initialHighlightColor: null,
        hoverSavedButton: false,
    }

    constructor(props: Props) {
        super(props)
        this.shortcutsData = new Map(
            props.shortcutsData.map((s) => [s.name, s]) as [
                string,
                ShortcutElData,
            ][],
        )

        this.settingsButtonRef = createRef<HTMLDivElement>()
    }

    async componentDidMount() {
        this.keyboardShortcuts = await getKeyboardShortcutsState()
        this.setState(() => ({ shortcutsReady: true }))
        await this.initialiseHighlightColor()

        const updatesAvailable = await browser.storage.local.get(
            READ_STORAGE_FLAG,
        )

        this.setState({
            updatesAvailable: !updatesAvailable[READ_STORAGE_FLAG],
        })
    }

    async setUpdateFlagToRead() {
        await browser.storage.local.set({ [READ_STORAGE_FLAG]: true })
    }

    async initialiseHighlightColor() {
        const {
            [HIGHLIGHT_COLOR_KEY]: highlightsColor,
        } = await browser.storage.local.get({
            [HIGHLIGHT_COLOR_KEY]: DEFAULT_HIGHLIGHT_COLOR,
        })
        this.setState({
            pickerColor: highlightsColor,
            initialHighlightColor: highlightsColor,
        })
    }

    updatePickerColor(value) {
        const previousColor = { ...this.state.pickerColor }
        this.setState({
            pickerColor: value,
        })

        let highlights: NodeListOf<Element> = document.querySelectorAll(
            '.' + DEF_HIGHLIGHT_CSS_CLASS,
        )

        for (let item of (highlights as any) as HTMLElement[]) {
            const existingStyle = item.style.backgroundColor
            let backgroundColor = ''

            if (existingStyle.startsWith('rgb(')) {
                backgroundColor = item.style.backgroundColor
                    .replace(')', ', 1)')
                    .replace('rgb(', 'rgba(')
            } else if (existingStyle.startsWith('rgba(')) {
                backgroundColor = existingStyle
            }
            if (backgroundColor === RGBAobjectToString(previousColor)) {
                item.setAttribute(
                    'style',
                    `background-color:${RGBAobjectToString(value)};`,
                )
            }
        }
    }

    async saveHighlightColor() {
        this.setState({
            renderFeedback: false,
            renderLiveChat: false,
            renderChangeLog: false,
        })
        this.props.toggleShowTutorial()

        await browser.storage.local.set({
            [HIGHLIGHT_COLOR_KEY]: this.state.pickerColor,
        })
    }

    focusCreateForm = () => this.annotationCreateRef?.getInstance()?.focus()

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
    private handleSharePageAction = (event) => {
        this.props.sidebar.sharePage()
    }

    private getTooltipText(name: string): JSX.Element | string {
        const elData = this.shortcutsData.get(name)
        const short: Shortcut = this.keyboardShortcuts[name]

        if (!elData) {
            return ''
        }

        let source = elData.tooltip

        if (['createBookmark'].includes(name)) {
            source = this.props.bookmark.isBookmarked
                ? elData.toggleOff
                : elData.toggleOn
        }
        if (['toggleSidebar'].includes(name)) {
            source = this.props.sidebar.isSidebarOpen
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
                        getRootElement={this.props.getRootElement}
                    />
                }
            </TooltipContent>
        ) : (
            source
        )
    }

    private getHotKey(
        name: string,
        size: 'small' | 'medium',
    ): JSX.Element | string {
        const elData = this.shortcutsData.get(name)
        const short: Shortcut = this.keyboardShortcuts[name]

        if (!elData) {
            return null
        }

        let source = elData.tooltip

        if (['createBookmark'].includes(name)) {
            source = this.props.bookmark.isBookmarked
                ? elData.toggleOff
                : elData.toggleOn
        }
        if (['toggleSidebar'].includes(name)) {
            source = this.props.sidebar.isSidebarOpen
                ? elData.toggleOff
                : elData.toggleOn
        }

        return short.shortcut && short.enabled ? (
            <TooltipContent>
                {
                    <KeyboardShortcuts
                        size={size ?? 'small'}
                        keys={short.shortcut.split('+')}
                        getRootElement={this.props.getRootElement}
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

        let pageTitle
        if (window.location.href.includes('web.telegram.org')) {
            pageTitle = getTelegramUserDisplayName(
                document,
                window.location.href,
            )
        }

        if (
            window.location.href.includes('x.com/messages/') ||
            window.location.href.includes('twitter.com/messages/')
        ) {
            pageTitle = document.title
        }

        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'
        const center = this.props.ribbonPosition === 'centerRight'
        const sidebarOpen = this.props.sidebar.isSidebarOpen

        const condition1 = topRight && !sidebarOpen
        const condition2 = bottomRight && !sidebarOpen
        const condition3 = center && !sidebarOpen
        const condition4 = sidebarOpen

        return (
            <PopoutBox
                getPortalRoot={this.props.getRootElement}
                targetElementRef={this.spacePickerRef.current}
                placement={
                    condition1
                        ? 'bottom-end'
                        : condition2
                        ? 'top-end'
                        : condition3
                        ? 'left-start'
                        : condition4
                        ? 'left-start'
                        : 'left-start'
                }
                offsetX={
                    condition1
                        ? 10
                        : condition2
                        ? 10
                        : condition3
                        ? 10
                        : condition4
                        ? 10
                        : 0
                }
                offsetY={
                    condition1
                        ? 10
                        : condition2
                        ? 10
                        : condition3
                        ? 10
                        : condition4
                        ? 0
                        : 0
                }
                closeComponent={this.hideListPicker}
            >
                <CollectionPicker
                    {...this.props.lists}
                    authBG={this.props.authBG}
                    spacesBG={this.props.spacesBG}
                    annotationsCache={this.props.annotationsCache}
                    contentSharingBG={this.props.contentSharingBG}
                    bgScriptBG={this.props.bgScriptBG}
                    analyticsBG={this.props.analyticsBG}
                    pageActivityIndicatorBG={this.props.pageActivityIndicatorBG}
                    localStorageAPI={browser.storage.local}
                    actOnAllTabs={this.props.lists.listAllTabs}
                    initialSelectedListIds={
                        this.props.lists.fetchInitialListSelections
                    }
                    onSpaceCreate={this.props.lists.onSpaceCreate}
                    closePicker={this.hideListPicker}
                    onListShare={this.props.onListShare}
                    onListFocus={(listId: UnifiedList['localId']) => {
                        this.props.sidebar.handleSidebarOpenInFocusMode(listId)
                    }}
                    getRootElement={this.props.getRootElement}
                />
            </PopoutBox>
        )
    }

    private renderTutorial() {
        if (!this.props.showTutorial) {
            return
        }

        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <PopoutBox
                targetElementRef={this.tutorialButtonRef.current}
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left-end'
                }
                offsetX={
                    topRight ||
                    (bottomRight && !this.props.sidebar.isSidebarOpen)
                        ? 18
                        : 10
                }
                closeComponent={() => {
                    this.setState({
                        renderFeedback: false,
                        renderLiveChat: false,
                        renderChangeLog: false,
                    })
                    this.props.toggleShowTutorial()
                }}
                width={'fit-content'}
                getPortalRoot={this.props.getRootElement}
            >
                <SupportContainer>
                    <GlobalStyle />
                    {this.state.renderFeedback ? (
                        <FeedbackContainer>
                            <LoadingIndicator size={30} />
                            <FeedFrame
                                src="https://memex.featurebase.app"
                                frameBorder="0"
                                width="100%"
                                height="533"
                            />
                        </FeedbackContainer>
                    ) : this.state.renderLiveChat ? (
                        <ChatBox>
                            <LoadingIndicator size={30} />
                            <ChatFrame
                                src={`https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599&user_email=${this.props.currentUser.email}`}
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
                        <SupportContainerBox>
                            <TutorialContainerBox>
                                <PrimaryAction
                                    onClick={() =>
                                        this.setState({
                                            renderLiveChat: true,
                                        })
                                    }
                                    label={'Chat with us'}
                                    icon={'chatWithUs'}
                                    type={'forth'}
                                    size={'medium'}
                                    fullWidth
                                    height="40px"
                                    iconPosition="left"
                                />
                                <SupportBox>
                                    {/* <ExtraButtonRow
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
                                        <InfoText>
                                            Feature Requests & Bugs
                                        </InfoText>
                                    </ExtraButtonRow> */}
                                    <ExtraButtonRow
                                        onClick={async () => {
                                            this.setState({
                                                renderChangeLog: true,
                                                updatesAvailable: false,
                                            })
                                            await this.setUpdateFlagToRead()
                                        }}
                                    >
                                        <Icon
                                            filePath={icons.clock}
                                            heightAndWidth="22px"
                                            hoverOff
                                        />
                                        <InfoText>What's new?</InfoText>
                                        {this.state.updatesAvailable && (
                                            <UpdateAvailablePill>
                                                New Updates
                                            </UpdateAvailablePill>
                                        )}
                                    </ExtraButtonRow>
                                    <ExtraButtonRow
                                        onClick={() =>
                                            this.props.setTutorialIdToOpen(
                                                'all',
                                            )
                                        }
                                    >
                                        <Icon
                                            filePath={icons.helpIcon}
                                            heightAndWidth="22px"
                                            hoverOff
                                        />
                                        <InfoText>All Tutorials</InfoText>
                                    </ExtraButtonRow>
                                </SupportBox>
                            </TutorialContainerBox>
                            <TutorialContainerBox>
                                <SectionTitle>Settings</SectionTitle>
                                <SupportBox>
                                    <ExtraButtonRow
                                        onClick={
                                            this.props.tooltip
                                                .handleTooltipToggle
                                        }
                                    >
                                        <Icon
                                            filePath={
                                                this.props.tooltip
                                                    .isTooltipEnabled
                                                    ? icons.tooltipOff
                                                    : icons.tooltipOn
                                            }
                                            heightAndWidth="22px"
                                            hoverOff
                                        />
                                        {this.props.tooltip.isTooltipEnabled ? (
                                            <InfoText>
                                                Hide Highlighter Tooltip
                                            </InfoText>
                                        ) : (
                                            <InfoText>
                                                Show Highlighter Tooltip
                                            </InfoText>
                                        )}
                                    </ExtraButtonRow>
                                    <ExtraButtonRow deactivateHover>
                                        <Icon
                                            filePath={icons.quickActionRibbon}
                                            heightAndWidth="22px"
                                            hoverOff
                                        />
                                        <InfoText>
                                            Change sidebar location
                                        </InfoText>
                                        <SelectionContainer>
                                            <SelectionDropDown
                                                onChange={(event) => {
                                                    this.props.toggleShowTutorial()

                                                    this.props.selectRibbonPositionOption(
                                                        event.target.value,
                                                    )
                                                }}
                                            >
                                                <SelectionItem
                                                    onClick={() => {
                                                        this.props.selectRibbonPositionOption(
                                                            'topRight',
                                                        )
                                                    }}
                                                    value={'topRight'}
                                                    selected={
                                                        this.props
                                                            .ribbonPosition ===
                                                        'topRight'
                                                    }
                                                >
                                                    Top Right
                                                </SelectionItem>
                                                <SelectionItem
                                                    onClick={() => {
                                                        this.props.toggleShowTutorial()
                                                        this.props.selectRibbonPositionOption(
                                                            'centerRight',
                                                        )
                                                    }}
                                                    value={'centerRight'}
                                                    selected={
                                                        this.props
                                                            .ribbonPosition ===
                                                        'centerRight'
                                                    }
                                                >
                                                    Center Right
                                                </SelectionItem>
                                                <SelectionItem
                                                    onClick={() => {
                                                        this.props.toggleShowTutorial()
                                                        this.props.selectRibbonPositionOption(
                                                            'bottomRight',
                                                        )
                                                    }}
                                                    value={'bottomRight'}
                                                    selected={
                                                        this.props
                                                            .ribbonPosition ===
                                                        'bottomRight'
                                                    }
                                                >
                                                    Bottom Right
                                                </SelectionItem>
                                            </SelectionDropDown>
                                        </SelectionContainer>
                                    </ExtraButtonRow>
                                    <ExtraButtonRow
                                        onClick={() =>
                                            this.props.bgScriptBG.openOptionsTab(
                                                {
                                                    query: 'settings',
                                                },
                                            )
                                        }
                                    >
                                        <Icon
                                            filePath={icons.settings}
                                            heightAndWidth="22px"
                                            hoverOff
                                        />
                                        <InfoText>All Settings</InfoText>
                                    </ExtraButtonRow>
                                </SupportBox>
                            </TutorialContainerBox>

                            <QuickTutorial
                                getKeyboardShortcutsState={
                                    getKeyboardShortcutsState
                                }
                                onSettingsClick={() =>
                                    this.props.bgScriptBG.openOptionsTab({
                                        query: 'settings',
                                    })
                                }
                                hideEditorTutorials
                                getRootElement={this.props.getRootElement}
                            />
                        </SupportContainerBox>
                    )}
                </SupportContainer>
            </PopoutBox>
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

        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <PopoutBox
                targetElementRef={this.feedButtonRef.current}
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left-start'
                }
                offsetX={
                    topRight ||
                    (bottomRight && !this.props.sidebar.isSidebarOpen)
                        ? 18
                        : 10
                }
                offsetY={-15}
                closeComponent={() => this.props.toggleFeed()}
                getPortalRoot={this.props.getRootElement}
            >
                <FeedContainer>
                    <TitleContainer>
                        <Icon heightAndWidth="22px" filePath="feed" hoverOff />
                        <TitleContent>
                            <NotificationsTitle>
                                Notifications
                            </NotificationsTitle>
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

    renderRemoveMenu() {
        if (!this.props.showRemoveMenu) {
            return
        }

        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <PopoutBox
                targetElementRef={this.removeMenuButtonRef.current}
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left-start'
                }
                offsetX={
                    topRight ||
                    (bottomRight && !this.props.sidebar.isSidebarOpen)
                        ? 10
                        : 10
                }
                closeComponent={() => {
                    this.props.toggleRemoveMenu()
                }}
                instaClose
                getPortalRoot={this.props.getRootElement}
            >
                <RemoveMenuContainer ribbonPosition={this.props.ribbonPosition}>
                    <ExtraButtonRow
                        onClick={() => this.props.handleRemoveRibbon()}
                    >
                        <Icon
                            filePath={'removeX'}
                            heightAndWidth="22px"
                            hoverOff
                        />
                        <InfoText>Hide Sidebar</InfoText>
                    </ExtraButtonRow>
                    <ExtraButtonRow deactivateHover>
                        <Icon
                            filePath={icons.quickActionRibbon}
                            heightAndWidth="22px"
                            hoverOff
                        />
                        <InfoText>Change sidebar location</InfoText>
                        <SelectionContainer>
                            <SelectionDropDown
                                onChange={(event) =>
                                    this.props.selectRibbonPositionOption(
                                        event.target.value,
                                    )
                                }
                            >
                                <SelectionItem
                                    onClick={() => {
                                        this.props.toggleShowTutorial()
                                        this.props.selectRibbonPositionOption(
                                            'topRight',
                                        )
                                    }}
                                    value={'topRight'}
                                    selected={
                                        this.props.ribbonPosition === 'topRight'
                                    }
                                >
                                    Top Right
                                </SelectionItem>
                                <SelectionItem
                                    onClick={() => {
                                        this.props.toggleShowTutorial()
                                        this.props.selectRibbonPositionOption(
                                            'centerRight',
                                        )
                                    }}
                                    value={'centerRight'}
                                    selected={
                                        this.props.ribbonPosition ===
                                        'centerRight'
                                    }
                                >
                                    Center Right
                                </SelectionItem>
                                <SelectionItem
                                    onClick={() => {
                                        this.props.toggleShowTutorial()
                                        this.props.selectRibbonPositionOption(
                                            'bottomRight',
                                        )
                                    }}
                                    value={'bottomRight'}
                                    selected={
                                        this.props.ribbonPosition ===
                                        'bottomRight'
                                    }
                                >
                                    Bottom Right
                                </SelectionItem>
                            </SelectionDropDown>
                        </SelectionContainer>
                    </ExtraButtonRow>
                    <ExtraButtonRow
                        onClick={() => {
                            this.props.handleRibbonToggle()
                            this.props.sidebar.closeSidebar()
                        }}
                    >
                        <Icon
                            filePath={icons.block}
                            heightAndWidth="22px"
                            hoverOff
                        />
                        {this.props.isRibbonEnabled ? (
                            <InfoText>Disable Sidebar on all pages</InfoText>
                        ) : (
                            <InfoText>Enable Sidebar on all pages</InfoText>
                        )}
                    </ExtraButtonRow>
                    <BlockListArea ribbonPosition={this.props.ribbonPosition}>
                        <BlockListTitleArea>
                            <BlockListTitleContent>
                                <InfoText>
                                    Add domain/page to sidebar block list
                                </InfoText>
                            </BlockListTitleContent>
                            <TooltipBox
                                tooltipText={'Modify existing block list'}
                                placement={'bottom'}
                                getPortalRoot={this.props.getRootElement}
                            >
                                <Icon
                                    onClick={() =>
                                        this.props.bgScriptBG.openOptionsTab({
                                            query: 'blocklist',
                                        })
                                    }
                                    filePath={'settings'}
                                    heightAndWidth={'22px'}
                                    color={'greyScale5'}
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
                                tooltipText={'Add this entry to the block list'}
                                placement={'bottom'}
                                getPortalRoot={this.props.getRootElement}
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
                </RemoveMenuContainer>
            </PopoutBox>
        )
    }

    renderBookmarksNudge = () => {
        if (this.props.showBookmarksNudge) {
            return renderNudgeTooltip(
                'Looks like an article worth saving!',
                'Hover over the brain icon or use hotkeys to save with Memex.',
                this.getHotKey('createBookmark', 'medium'),
                '450px',
                () => this.props.setShowBookmarksNudge(false, false), // hide forever
                () => this.props.setShowBookmarksNudge(false, true), // snooze
                this.props.getRootElement,
                this.memexLogoRef.current,
                'top-end',
            )
        }
    }

    renderFeedButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <TooltipBox
                targetElementRef={this.feedButtonRef.current}
                tooltipText={'Show Feed'}
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left'
                }
                offsetX={0}
                getPortalRoot={this.props.getRootElement}
            >
                <FeedButtonContainer ribbonPosition={this.props.ribbonPosition}>
                    <FeedIndicatorBox
                        isSidebarOpen={this.props.sidebar.isSidebarOpen}
                        onClick={() => this.props.toggleFeed()}
                        ref={this.feedButtonRef}
                    >
                        <FeedActivityDot
                            key="activity-feed-indicator"
                            // itemRef={this.feedButtonRef}
                            // clickedOn={() => this.props.toggleFeed()}
                            {...this.props.activityIndicator}
                        />
                    </FeedIndicatorBox>
                </FeedButtonContainer>
            </TooltipBox>
        )
    }

    renderCloseButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <TooltipBox
                targetElementRef={this.feedButtonRef.current}
                tooltipText={
                    <TooltipContent>
                        <TooltipContentBox>
                            <CloseTooltipInnerBox>
                                Close{' '}
                                <KeyboardShortcuts
                                    keys={['Esc']}
                                    size="small"
                                    getRootElement={this.props.getRootElement}
                                />{' '}
                            </CloseTooltipInnerBox>
                            and {this.getTooltipText('toggleSidebar')}
                        </TooltipContentBox>
                    </TooltipContent>
                }
                getPortalRoot={this.props.getRootElement}
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left'
                }
                offsetX={
                    topRight ||
                    (bottomRight && !this.props.sidebar.isSidebarOpen)
                        ? 18
                        : 10
                }
            >
                <Icon
                    filePath="removeX"
                    heightAndWidth="20px"
                    color="greyScale6"
                    onClick={() => this.props.sidebar.closeSidebar()}
                />
            </TooltipBox>
        )
    }

    renderReadingViewToggleButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        if (!this.props.sidebar.isWidthLocked) {
            return (
                <TooltipBox
                    tooltipText="Side-by-Side Reading"
                    placement={
                        this.props.sidebar.isSidebarOpen
                            ? 'left'
                            : topRight
                            ? 'bottom'
                            : bottomRight
                            ? 'top'
                            : 'left'
                    }
                    getPortalRoot={this.props.getRootElement}
                >
                    <Icon
                        filePath={icons.sideBySide}
                        heightAndWidth="20px"
                        color={'greyScale6'}
                        onClick={() => this.props.sidebar.toggleReadingView()}
                    />
                </TooltipBox>
            )
        } else {
            return (
                <TooltipBox
                    tooltipText="Full Page Reading"
                    placement={
                        this.props.sidebar.isSidebarOpen
                            ? 'left'
                            : topRight
                            ? 'bottom'
                            : bottomRight
                            ? 'top'
                            : 'left'
                    }
                    getPortalRoot={this.props.getRootElement}
                >
                    <Icon
                        filePath={icons.fullPageReading}
                        heightAndWidth="20px"
                        color={'greyScale6'}
                        onClick={() => this.props.sidebar.toggleReadingView()}
                    />
                </TooltipBox>
            )
        }
    }

    renderBookmarkButton() {
        let bookmarkDate
        if (this.props.bookmark.lastBookmarkTimestamp != null) {
            bookmarkDate = moment
                .unix(this.props.bookmark.lastBookmarkTimestamp)
                .format('LLL')
        }

        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <TooltipBox
                tooltipText={
                    this.props.bookmark.isBookmarked ? (
                        <TooltipContent>
                            <TooltipContentBox>
                                <span>
                                    First saved on{' '}
                                    <DateText>{bookmarkDate}</DateText>
                                </span>
                                <div>
                                    <strong>{Ribbon.ALT_KEY} + Click</strong>for
                                    tutorials
                                </div>
                            </TooltipContentBox>
                        </TooltipContent>
                    ) : (
                        <TooltipContent>
                            <TooltipContentBox>
                                <span>
                                    {this.getTooltipText('createBookmark')}
                                </span>
                                <div>
                                    <strong>{Ribbon.ALT_KEY} + Click</strong>for
                                    tutorials
                                </div>
                            </TooltipContentBox>
                        </TooltipContent>
                    )
                }
                getPortalRoot={this.props.getRootElement}
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left'
                }
                offsetX={10}
            >
                {(topRight || bottomRight) &&
                !this.props.sidebar.isSidebarOpen ? (
                    <>
                        {this.state.hoverSavedButton ? (
                            <PrimaryAction
                                size={'medium'}
                                type="tertiary"
                                onMouseLeave={() => {
                                    this.setState({
                                        hoverSavedButton: false,
                                    })
                                }}
                                width={'90px'}
                                label={'Delete'}
                                fontColor={'greyScale8'}
                                onClick={(e) => {
                                    if (this.props.bookmark.isBookmarked) {
                                        this.props.confirmDeletion(true)
                                    }
                                }}
                                icon={'removeX'}
                                iconColor={
                                    this.props.bookmark.isBookmarked
                                        ? 'prime1'
                                        : 'greyScale5'
                                }
                            />
                        ) : (
                            <PrimaryAction
                                size={'medium'}
                                type="tertiary"
                                width={'90px'}
                                onMouseEnter={() => {
                                    if (this.props.bookmark.isBookmarked) {
                                        this.setState({
                                            hoverSavedButton: true,
                                        })
                                    }
                                }}
                                label={
                                    this.props.bookmark.isBookmarked ? (
                                        <SavedButtonBox>Saved</SavedButtonBox>
                                    ) : (
                                        'Save'
                                    )
                                }
                                fontColor={'greyScale8'}
                                onClick={(e) => {
                                    if (e.altKey) {
                                        this.props.setTutorialIdToOpen(
                                            'savePages',
                                        )
                                    } else {
                                        this.props.bookmark.toggleBookmark()
                                    }
                                }}
                                icon={
                                    this.props.bookmark.isBookmarked
                                        ? 'heartFull'
                                        : 'heartEmpty'
                                }
                                iconColor={
                                    this.props.bookmark.isBookmarked
                                        ? 'prime1'
                                        : 'greyScale5'
                                }
                            />
                        )}
                    </>
                ) : (
                    <Icon
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('savePages')
                            } else {
                                this.props.bookmark.toggleBookmark()
                            }
                        }}
                        color={
                            this.props.bookmark.isBookmarked
                                ? 'prime1'
                                : 'greyScale6'
                        }
                        heightAndWidth="20px"
                        filePath={
                            this.props.bookmark.isBookmarked
                                ? icons.heartFull
                                : icons.heartEmpty
                        }
                    />
                )}
            </TooltipBox>
        )
    }

    renderSpacesButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <TooltipBox
                tooltipText={
                    <TooltipContent>
                        <TooltipContentBox>
                            {this.getTooltipText('addToCollection')}
                            <div>
                                <strong>{Ribbon.ALT_KEY} + Click</strong>for
                                tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                }
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left'
                }
                getPortalRoot={this.props.getRootElement}
                offsetX={10}
            >
                {(topRight || bottomRight) &&
                !this.props.sidebar.isSidebarOpen ? (
                    <IconBox
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('organiseSpaces')
                            } else {
                                this.props.lists.setShowListsPicker(
                                    !this.props.lists.showListsPicker,
                                )
                            }
                        }}
                    >
                        <PrimaryAction
                            size={'medium'}
                            type="tertiary"
                            label={'Spaces'}
                            fontColor={'greyScale8'}
                            onClick={null}
                            icon={'plus'}
                            innerRef={this.spacePickerRef}
                            active={this.props.lists.showListsPicker}
                        />
                        {this.props.lists.pageListIds.length > 0 && (
                            <SpacesCounter>
                                {this.props.lists.pageListIds.length}
                            </SpacesCounter>
                        )}
                    </IconBox>
                ) : (
                    <IconBox
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('organiseSpaces')
                            } else {
                                this.props.lists.setShowListsPicker(
                                    !this.props.lists.showListsPicker,
                                )
                            }
                        }}
                    >
                        <Icon
                            onClick={(e) => {
                                if (e.altKey) {
                                    this.props.setTutorialIdToOpen(
                                        'organiseSpaces',
                                    )
                                } else {
                                    this.props.lists.setShowListsPicker(
                                        !this.props.lists.showListsPicker,
                                    )
                                }
                            }}
                            color={
                                this.props.lists.pageListIds.length > 0
                                    ? 'prime1'
                                    : 'greyScale6'
                            }
                            heightAndWidth="22px"
                            filePath={'plus'}
                            containerRef={this.spacePickerRef}
                            active={this.props.lists.showListsPicker}
                        />
                        {this.props.lists.pageListIds.length > 0 && (
                            <SpacesCounter>
                                {this.props.lists.pageListIds.length}
                            </SpacesCounter>
                        )}
                    </IconBox>
                )}
            </TooltipBox>
        )
    }

    renderSidebarToggle() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <TooltipBox
                targetElementRef={this.sidebarButtonRef.current}
                tooltipText={
                    <TooltipContent>
                        <TooltipContentBox>
                            {this.getTooltipText('toggleSidebar')}
                            <div>
                                <strong>{Ribbon.ALT_KEY} + Click</strong>for
                                tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                }
                placement={topRight ? 'top' : bottomRight ? 'bottom' : 'left'}
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                {(topRight || bottomRight) &&
                !this.props.sidebar.isSidebarOpen ? (
                    <IconBox
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('annotatePages')
                            } else {
                                this.handleCommentIconBtnClick(e)
                            }
                        }}
                    >
                        <PrimaryAction
                            size={'medium'}
                            type="tertiary"
                            label={'Notes'}
                            fontColor={'greyScale8'}
                            onClick={null}
                            icon={
                                this.props.commentBox.isCommentSaved
                                    ? 'saveIcon'
                                    : 'commentAdd'
                            }
                        />
                        {this.props.annotationsCache.annotations.allIds.length >
                            0 && (
                            <SpacesCounter>
                                {
                                    this.props.annotationsCache.annotations
                                        .allIds.length
                                }
                            </SpacesCounter>
                        )}
                    </IconBox>
                ) : (
                    <IconBox
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('annotatePages')
                            } else {
                                this.handleCommentIconBtnClick(e)
                            }
                        }}
                    >
                        <Icon
                            color={'greyScale6'}
                            heightAndWidth="20px"
                            filePath={
                                this.props.commentBox.isCommentSaved
                                    ? icons.saveIcon
                                    : // : this.props.hasAnnotations
                                      // ? icons.commentFull
                                      icons.commentAdd
                            }
                            containerRef={this.sidebarButtonRef}
                        />
                        {this.props.annotationsCache.annotations.allIds.length >
                            0 && (
                            <SpacesCounter>
                                {
                                    this.props.annotationsCache.annotations
                                        .allIds.length
                                }
                            </SpacesCounter>
                        )}
                    </IconBox>
                )}
            </TooltipBox>
        )
    }
    renderSharePageButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <TooltipBox
                targetElementRef={this.sidebarButtonRef.current}
                tooltipText={
                    <TooltipContent>
                        <TooltipContentBox>
                            {this.getTooltipText('sharePage')}
                            <div>
                                <strong>{Ribbon.ALT_KEY} + Click</strong>for
                                tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                }
                placement={topRight ? 'top' : bottomRight ? 'bottom' : 'left'}
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                {(topRight || bottomRight) &&
                !this.props.sidebar.isSidebarOpen ? (
                    <IconBox
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('useTemplates')
                            } else {
                                this.handleSharePageAction(e)
                            }
                        }}
                    >
                        <PrimaryAction
                            size={'medium'}
                            type="tertiary"
                            label={'Cite'}
                            fontColor={'greyScale8'}
                            onClick={null}
                            icon={'copy'}
                        />
                    </IconBox>
                ) : (
                    <IconBox
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('useTemplates')
                            } else {
                                this.handleSharePageAction(e)
                            }
                        }}
                    >
                        <Icon
                            color={'greyScale6'}
                            heightAndWidth="20px"
                            filePath={'copy'}
                            containerRef={this.sidebarButtonRef}
                        />
                    </IconBox>
                )}
            </TooltipBox>
        )
    }

    renderSearchButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <TooltipBox
                tooltipText={
                    <TooltipContent>
                        <TooltipContentBox>
                            {this.getTooltipText('openDashboard')}
                            <div>
                                <strong>+ shift </strong>to open in new tab
                            </div>
                            <div>
                                <strong>{Ribbon.ALT_KEY} + Click</strong>for
                                tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                }
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left'
                }
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                {(topRight || bottomRight) &&
                !this.props.sidebar.isSidebarOpen ? (
                    <PrimaryAction
                        size={'medium'}
                        type="tertiary"
                        label={'Search'}
                        fontColor={'greyScale8'}
                        onClick={(e) => {
                            if (e.shiftKey) {
                                e.stopPropagation()
                                this.props.bgScriptBG.openOverviewTab({})
                            } else if (e.altKey) {
                                e.stopPropagation()
                                this.props.setTutorialIdToOpen('savePages')
                            } else {
                                e.stopPropagation()
                                this.props.toggleQuickSearch()
                            }
                        }}
                        icon={'searchIcon'}
                    />
                ) : (
                    <Icon
                        onClick={(e) => {
                            if (e.shiftKey) {
                                e.stopPropagation()
                                this.props.bgScriptBG.openOverviewTab({})
                            } else if (e.altKey) {
                                e.stopPropagation()
                                this.props.setTutorialIdToOpen('savePages')
                            } else {
                                e.stopPropagation()
                                this.props.toggleQuickSearch()
                            }
                        }}
                        color={'greyScale6'}
                        heightAndWidth="20px"
                        filePath={icons.searchIcon}
                    />
                )}
            </TooltipBox>
        )
    }

    renderAItriggerButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'
        return (
            <TooltipBox
                tooltipText={
                    <TooltipContent>
                        <TooltipContentBox>
                            {this.getTooltipText('askAI')}
                            <div>
                                <strong>Shift + Click</strong>to insta execute
                                with default template
                            </div>
                            <div>
                                <strong>{Ribbon.ALT_KEY} + Click</strong>for
                                tutorials
                            </div>
                        </TooltipContentBox>
                    </TooltipContent>
                }
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left'
                }
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                {(topRight || bottomRight) &&
                !this.props.sidebar.isSidebarOpen ? (
                    <PrimaryAction
                        size={'medium'}
                        type="tertiary"
                        label={'Ask'}
                        fontColor={'greyScale8'}
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('askAI')
                            } else if (e.shiftKey) {
                                this.props.toggleAskAI(true)
                            } else {
                                this.props.toggleAskAI(false)
                            }
                        }}
                        icon={'stars'}
                    />
                ) : (
                    <Icon
                        onClick={(e) => {
                            if (e.altKey) {
                                this.props.setTutorialIdToOpen('askAI')
                            } else if (e.shiftKey) {
                                this.props.toggleAskAI(true)
                            } else {
                                this.props.toggleAskAI(false)
                            }
                        }}
                        color={'greyScale6'}
                        heightAndWidth="20px"
                        filePath={icons.stars}
                    />
                )}
            </TooltipBox>
        )
    }
    renderRabbitHoleTriggerButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'
        return (
            <TooltipBox
                tooltipText={'Go down the Rabbit Hole'}
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left'
                }
                offsetX={10}
                getPortalRoot={this.props.getRootElement}
            >
                {(topRight || bottomRight) &&
                !this.props.sidebar.isSidebarOpen ? (
                    <PrimaryAction
                        size={'medium'}
                        type="tertiary"
                        label={`🐇 Rabbit Hole`}
                        fontColor={'greyScale8'}
                        onClick={() => this.props.toggleRabbitHole()}
                    />
                ) : (
                    <Icon
                        onClick={() => this.props.toggleRabbitHole()}
                        color={'greyScale6'}
                        heightAndWidth="20px"
                        filePath={icons.stars}
                    />
                )}
            </TooltipBox>
        )
    }

    renderPDFReaderButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        const isNotReader =
            window.location.href.includes('.pdf') &&
            !window.location.href.includes('pdfjs/viewer.html?')

        const isPDF = window.location.href.includes('.pdf')

        if (isPDF) {
            if (
                (topRight || bottomRight) &&
                !this.props.sidebar.isSidebarOpen
            ) {
                return isNotReader ? (
                    <TooltipBox
                        tooltipText={
                            <TooltipContent>
                                <TooltipContentBox>
                                    <span>
                                        Open PDF Reader
                                        <br />
                                        to save, sort, annotate & summarize
                                    </span>
                                    <div>
                                        <strong>
                                            {Ribbon.ALT_KEY} + Click
                                        </strong>
                                        for tutorials
                                    </div>
                                </TooltipContentBox>
                            </TooltipContent>
                        }
                        placement={
                            this.props.sidebar.isSidebarOpen
                                ? 'left'
                                : topRight
                                ? 'bottom'
                                : bottomRight
                                ? 'top'
                                : 'left'
                        }
                        offsetX={10}
                        getPortalRoot={this.props.getRootElement}
                    >
                        <PrimaryAction
                            size={'medium'}
                            type="tertiary"
                            label={'Open PDF Reader'}
                            fontColor={'greyScale8'}
                            onClick={(e) => {
                                if (e.altKey) {
                                    this.props.setTutorialIdToOpen(
                                        'annotatePDFs',
                                    )
                                } else {
                                    this.props.openPDFinViewer()
                                }
                            }}
                            icon={'filePDF'}
                            innerRef={this.spacePickerRef}
                        />
                    </TooltipBox>
                ) : (
                    <TooltipBox
                        tooltipText={
                            <TooltipContent>
                                <TooltipContentBox>
                                    <span>
                                        Close PDF Reader
                                        <br />
                                        to save, sort, annotate & summarize
                                    </span>
                                    <div>
                                        <strong>
                                            {Ribbon.ALT_KEY} + Click
                                        </strong>
                                        for tutorials
                                    </div>
                                </TooltipContentBox>
                            </TooltipContent>
                        }
                        placement={
                            this.props.sidebar.isSidebarOpen
                                ? 'left'
                                : topRight
                                ? 'bottom'
                                : bottomRight
                                ? 'top'
                                : 'left'
                        }
                        offsetX={10}
                        getPortalRoot={this.props.getRootElement}
                    >
                        <PrimaryAction
                            size={'medium'}
                            type="tertiary"
                            label={'Close PDF Reader'}
                            fontColor={'greyScale8'}
                            onClick={() => this.props.openPDFinViewer()}
                            icon={'filePDF'}
                            innerRef={this.spacePickerRef}
                        />
                    </TooltipBox>
                )
            }

            if (
                (!topRight && !bottomRight) ||
                this.props.sidebar.isSidebarOpen
            ) {
                return isNotReader ? (
                    <TooltipBox
                        tooltipText={
                            <TooltipContent>
                                <TooltipContentBox>
                                    <span>
                                        Open PDF Reader
                                        <br />
                                        to save, sort, annotate & summarize
                                    </span>
                                    <div>
                                        <strong>
                                            {Ribbon.ALT_KEY} + Click
                                        </strong>
                                        for tutorials
                                    </div>
                                </TooltipContentBox>
                            </TooltipContent>
                        }
                        placement={
                            this.props.sidebar.isSidebarOpen
                                ? 'left'
                                : topRight
                                ? 'bottom'
                                : bottomRight
                                ? 'top'
                                : 'left'
                        }
                        offsetX={10}
                        getPortalRoot={this.props.getRootElement}
                    >
                        <Icon
                            onClick={(e) => {
                                if (e.altKey) {
                                    this.props.setTutorialIdToOpen(
                                        'annotatePDFs',
                                    )
                                } else {
                                    this.props.openPDFinViewer()
                                }
                            }}
                            color={'greyScale6'}
                            heightAndWidth="20px"
                            filePath={icons.filePDF}
                        />
                    </TooltipBox>
                ) : (
                    <TooltipBox
                        tooltipText={
                            <TooltipContent>
                                <TooltipContentBox>
                                    <span>
                                        Close PDF Reader
                                        <br />
                                        to save, sort, annotate & summarize
                                    </span>
                                    <div>
                                        <strong>
                                            {Ribbon.ALT_KEY} + Click
                                        </strong>
                                        for tutorials
                                    </div>
                                </TooltipContentBox>
                            </TooltipContent>
                        }
                        placement={
                            this.props.sidebar.isSidebarOpen
                                ? 'left'
                                : topRight
                                ? 'bottom'
                                : bottomRight
                                ? 'top'
                                : 'left'
                        }
                        offsetX={10}
                        getPortalRoot={this.props.getRootElement}
                    >
                        <Icon
                            onClick={(e) => {
                                if (e.altKey) {
                                    this.props.setTutorialIdToOpen(
                                        'annotatePDFs',
                                    )
                                } else {
                                    this.props.openPDFinViewer()
                                }
                            }}
                            color={'prime1'}
                            heightAndWidth="20px"
                            filePath={icons.filePDF}
                        />
                    </TooltipBox>
                )
            }
        }
    }

    renderTutorialButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'

        return (
            <TooltipBox
                tooltipText={
                    <span>
                        Settings, Help &
                        <br />
                        Keyboard Shortcuts
                    </span>
                }
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left-end'
                        : topRight
                        ? 'bottom'
                        : bottomRight
                        ? 'top'
                        : 'left'
                }
                offsetX={15}
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    onClick={() => this.props.toggleShowTutorial()}
                    color={'greyScale5'}
                    heightAndWidth="22px"
                    filePath={icons.helpIcon}
                    containerRef={this.tutorialButtonRef}
                />
                {this.state.updatesAvailable && <UpdateAvailableDot />}
            </TooltipBox>
        )
    }

    renderCloseRibbonButton() {
        const topRight = this.props.ribbonPosition === 'topRight'
        const bottomRight = this.props.ribbonPosition === 'bottomRight'
        return (
            <TooltipBox
                tooltipText={
                    <span>
                        One Click: More Options
                        <br /> Double Click: Instant remove action bar
                    </span>
                }
                placement={
                    this.props.sidebar.isSidebarOpen
                        ? 'left-end'
                        : topRight
                        ? 'bottom-end'
                        : bottomRight
                        ? 'top-end'
                        : 'left'
                }
                offsetX={15}
                getPortalRoot={this.props.getRootElement}
            >
                {!this.props.sidebar.isSidebarOpen && (
                    <CloseIconContainer
                        onMouseDown={(event) => {
                            if (!this.props.showRemoveMenu) {
                                this.props.toggleRemoveMenu()
                            }
                        }}
                        onMouseUp={(event) => {
                            if (!this.props.showRemoveMenu) {
                                this.props.handleRemoveRibbon()
                            }
                        }}
                    >
                        <Icon
                            // onClick={(event) => {
                            //     if (this.props.showRemoveMenu) {
                            //         this.props.handleRemoveRibbon()
                            //     } else {
                            //         this.props.toggleRemoveMenu()
                            //     }
                            // }}
                            // onClick={(event) => {
                            //     if (event.shiftKey && this.props.isRibbonEnabled) {
                            //         this.props.handleHover()
                            //     } else {
                            //         this.props.handleRemoveRibbon()
                            //     }
                            // }}
                            color={'greyScale5'}
                            heightAndWidth="24px"
                            padding="4px"
                            filePath={icons.removeX}
                            containerRef={this.removeMenuButtonRef}
                        />
                    </CloseIconContainer>
                )}
            </TooltipBox>
        )
    }

    renderDarkLightModeToggle() {
        return (
            <Icon
                heightAndWidth="20px"
                color={
                    this.props.theme === 'dark' ? 'greyScale5' : 'greyScale4'
                }
                filePath={this.props.theme === 'dark' ? 'moon' : 'sun'}
                onClick={() => this.props.toggleTheme()}
            />
        )
    }

    renderTutorialBox() {
        if (this.props.tutorialIdToOpen === null) {
            return
        }
        return (
            <TutorialBox
                tutorialId={this.props.tutorialIdToOpen}
                getRootElement={this.props.getRootElement}
                onTutorialClose={() => this.props.setTutorialIdToOpen(null)}
                isHeadless
            />
        )
    }

    renderHorizontalRibbon() {
        const isYoutube = isUrlYTVideo(window.location.href)

        if (!this.props.isExpanded) {
            return (
                <IconContainer
                    ref={this.props.setRef}
                    // isPeeking={this.props.isExpanded}
                    // isSidebarOpen={this.props.sidebar.isSidebarOpen}
                    ribbonPosition={this.props.ribbonPosition}
                    isYoutube={isYoutube}
                >
                    {this.renderBookmarksNudge()}

                    {this.props.hasFeedActivity && (
                        <FeedActivityDotBox>
                            <FeedActivityDot
                                key="activity-feed-indicator"
                                noRing={true}
                                {...this.props.activityIndicator}
                            />
                        </FeedActivityDotBox>
                    )}
                    {this.props.lists.pageListIds.length > 0 && (
                        <PillCounter>
                            {this.props.lists.pageListIds.length}
                        </PillCounter>
                    )}
                    {this.props.bookmark.isBookmarked ? (
                        <Icon
                            icon={icons.heartFull}
                            heightAndWidth="18px"
                            color={
                                this.props.theme !== 'light'
                                    ? 'prime1'
                                    : 'greyScale5'
                            }
                        />
                    ) : (
                        <Icon
                            icon={logoNoText}
                            heightAndWidth="18px"
                            color={
                                this.props.theme !== 'light'
                                    ? 'greyScale7'
                                    : 'greyScale5'
                            }
                            containerRef={this.memexLogoRef}
                        />
                    )}
                </IconContainer>
            )
        } else {
            return (
                <>
                    <InnerRibbon
                        ref={this.props.setRef}
                        isPeeking={this.props.isExpanded}
                        isSidebarOpen={this.props.sidebar.isSidebarOpen}
                        ribbonPosition={this.props.ribbonPosition}
                        isYoutube={isYoutube}
                    >
                        {(this.props.isExpanded ||
                            this.props.sidebar.isSidebarOpen) && (
                            <>
                                <UpperPart
                                    ribbonPosition={this.props.ribbonPosition}
                                    isSidebarOpen={
                                        this.props.sidebar.isSidebarOpen
                                    }
                                >
                                    <BottomSection
                                        sidebarOpen={
                                            this.props.sidebar.isSidebarOpen
                                        }
                                        ribbonPosition={
                                            this.props.ribbonPosition
                                        }
                                    >
                                        {this.renderFeedButton()}
                                        <BlockCounterIndicator
                                            ribbonPosition={
                                                this.props.ribbonPosition
                                            }
                                            isSidebarOpen={
                                                this.props.sidebar.isSidebarOpen
                                            }
                                            isTrial={this.props.isTrial}
                                            signupDate={this.props.signupDate}
                                            getRootElement={
                                                this.props.getRootElement
                                            }
                                            events={this.props.events}
                                            forceRibbonShow={
                                                this.props.forceRibbonShow
                                            }
                                        />
                                        {this.renderTutorialButton()}
                                    </BottomSection>

                                    <VerticalLine
                                        sidebaropen={
                                            this.props.sidebar.isSidebarOpen
                                        }
                                    />
                                    {window.location.href.includes('.pdf') &&
                                    !window.location.href.includes(
                                        'pdfjs/viewer.html?',
                                    ) ? (
                                        <PageAction
                                            ribbonPosition={
                                                this.props.ribbonPosition
                                            }
                                            isSidebarOpen={
                                                this.props.sidebar.isSidebarOpen
                                            }
                                        >
                                            {this.renderSearchButton()}
                                            {this.renderPDFReaderButton()}
                                            {this.renderCloseRibbonButton()}
                                        </PageAction>
                                    ) : (
                                        <PageAction
                                            ribbonPosition={
                                                this.props.ribbonPosition
                                            }
                                            isSidebarOpen={
                                                this.props.sidebar.isSidebarOpen
                                            }
                                        >
                                            {this.props.sidebar
                                                .isSidebarOpen && (
                                                <UpperArea>
                                                    {this.props.sidebar
                                                        .isSidebarOpen ? (
                                                        <>
                                                            {this.renderCloseButton()}
                                                            {this.renderReadingViewToggleButton()}
                                                        </>
                                                    ) : undefined}
                                                </UpperArea>
                                            )}
                                            {this.renderPDFReaderButton()}
                                            {this.renderSearchButton()}
                                            {!this.props.sidebar
                                                .isSidebarOpen &&
                                                this.renderAItriggerButton()}
                                            {!this.props.sidebar
                                                .isSidebarOpen &&
                                                this.props
                                                    .showRabbitHoleButton &&
                                                this.renderRabbitHoleTriggerButton()}
                                            {!this.props.sidebar
                                                .isSidebarOpen &&
                                                this.renderSharePageButton()}

                                            {!this.props.sidebar
                                                .isSidebarOpen &&
                                                this.renderSidebarToggle()}

                                            {this.renderSpacesButton()}
                                            {this.renderBookmarkButton()}
                                            {this.renderCloseRibbonButton()}
                                        </PageAction>
                                    )}
                                </UpperPart>
                            </>
                        )}
                    </InnerRibbon>
                    {this.renderTutorialBox()}
                    {this.renderSpacePicker()}
                    {this.renderTutorial()}
                    {this.renderFeedInfo()}
                    {this.renderRemoveMenu()}
                    {this.props.bookmark.writeError && (
                        <ErrorNotification
                            closeComponent={() => {
                                this.props.setWriteError(null)
                            }}
                            getPortalRoot={this.props.getRootElement}
                            blockedBackground
                            positioning="centerCenter"
                            title="Error saving note"
                            errorMessage={this.props.bookmark.writeError}
                        />
                    )}
                    {this.props.showConfirmDeletion && (
                        <OverlayModals
                            closeComponent={() => {
                                this.props.confirmDeletion(false)
                            }}
                            getPortalRoot={this.props.getRootElement}
                            blockedBackground
                            positioning="centerCenter"
                        >
                            <DeleteConfirmModal
                                isShown
                                message="Delete page and related notes?"
                                onClose={async () => {
                                    this.props.confirmDeletion(false)
                                }}
                                deleteDocs={async () => this.props.deletePage()}
                            />
                        </OverlayModals>
                    )}
                </>
            )
        }
    }

    renderVerticalRibbon() {
        const isYoutube = isUrlYTVideo(window.location.href)
        return (
            <>
                {this.props.bookmark.writeError && (
                    <ErrorNotification
                        closeComponent={() => {
                            this.props.setWriteError(null)
                        }}
                        getPortalRoot={this.props.getRootElement}
                        blockedBackground
                        positioning="centerCenter"
                        title="Error saving note"
                        errorMessage={this.props.bookmark.writeError}
                    />
                )}

                <InnerRibbon
                    ref={this.props.setRef}
                    isPeeking={this.props.isExpanded}
                    isSidebarOpen={this.props.sidebar.isSidebarOpen}
                    ribbonPosition={this.props.ribbonPosition}
                    isYoutube={isYoutube}
                >
                    {(this.props.isExpanded ||
                        this.props.sidebar.isSidebarOpen) && (
                        <>
                            <UpperPart
                                ribbonPosition={this.props.ribbonPosition}
                                isSidebarOpen={this.props.sidebar.isSidebarOpen}
                            >
                                <PageAction
                                    ribbonPosition={this.props.ribbonPosition}
                                    isSidebarOpen={
                                        this.props.sidebar.isSidebarOpen
                                    }
                                >
                                    {this.props.sidebar.isSidebarOpen && (
                                        <UpperArea>
                                            {this.props.sidebar
                                                .isSidebarOpen ? (
                                                <>
                                                    {this.renderCloseButton()}
                                                    {this.renderReadingViewToggleButton()}
                                                </>
                                            ) : undefined}
                                            <HorizontalLine
                                                sidebaropen={
                                                    this.props.sidebar
                                                        .isSidebarOpen
                                                }
                                            />
                                        </UpperArea>
                                    )}

                                    {this.renderBookmarkButton()}
                                    {this.renderSpacesButton()}
                                    {!this.props.sidebar.isSidebarOpen &&
                                        this.renderSidebarToggle()}
                                    {this.renderSearchButton()}
                                    {!this.props.sidebar.isSidebarOpen &&
                                        this.props.showRabbitHoleButton &&
                                        this.renderRabbitHoleTriggerButton()}
                                    {!this.props.sidebar.isSidebarOpen &&
                                        this.renderAItriggerButton()}
                                    {this.renderPDFReaderButton()}
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
                                sidebarOpen={this.props.sidebar.isSidebarOpen}
                                ribbonPosition={this.props.ribbonPosition}
                            >
                                {this.renderFeedButton()}
                                {this.renderDarkLightModeToggle()}
                                {this.renderTutorialButton()}
                                <BlockCounterIndicator
                                    ribbonPosition={this.props.ribbonPosition}
                                    isSidebarOpen={
                                        this.props.sidebar.isSidebarOpen
                                    }
                                    isTrial={this.props.isTrial}
                                    signupDate={this.props.signupDate}
                                    getRootElement={this.props.getRootElement}
                                    events={this.props.events}
                                    forceRibbonShow={this.props.forceRibbonShow}
                                />
                                {this.renderCloseRibbonButton()}
                            </BottomSection>
                        </>
                    )}
                </InnerRibbon>
                {this.renderTutorialBox()}
                {this.renderSpacePicker()}
                {this.renderTutorial()}
                {this.renderFeedInfo()}
                {this.renderRemoveMenu()}
            </>
        )
    }

    render() {
        if (!this.state.shortcutsReady) {
            return false
        }

        if (
            (this.props.ribbonPosition === 'topRight' ||
                this.props.ribbonPosition === 'bottomRight') &&
            !this.props.sidebar.isSidebarOpen
        ) {
            return this.renderHorizontalRibbon()
        }
        if (
            this.props.ribbonPosition === 'centerRight' ||
            this.props.sidebar.isSidebarOpen
        ) {
            return this.renderVerticalRibbon()
        }
        return null
    }
}

const CloseIconContainer = styled.div``

const TooltipContentBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;

    * strong {
        margin-right: 5px;
    }
`
const CloseTooltipInnerBox = styled.div`
    display: flex;
    flex-direction: row;
    grid-gap: 5px;
    align-items: center;
    justify-content: center;
`

const SelectionItem = styled.option``
const SelectionDropDown = styled.select`
    font-size: 12px;
    font-weight: 400;
    background: ${(props) => props.theme.colors.greyScale1};
    color: ${(props) => props.theme.colors.greyScale6};
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    border-radius: 3px;
    padding: 3px;
    outline: none;
`
const SelectionContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    flex: 1;
`

const FeedActivityDotBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-right: 3px;
    margin-left: 3px;
`

const FeedButtonContainer = styled.div<{ ribbonPosition }>`
    display: flex;
    align-items: center;
    justify-content: center;
`

const IconBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`

const IconContainer = styled.div<{ ribbonPosition; isYoutube: boolean }>`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    cursor: pointer;
    padding: 0 8px;
    grid-gap: 5px;
    height: 30px;
    width: fit-content;
    background: ${(props) => props.theme.colors.greyScale1}95;


    ${(props) =>
        props.ribbonPosition === 'bottomRight' &&
        css`
            border-radius: 8px 0 0 0;
        `}
    ${(props) =>
        props.ribbonPosition === 'topRight' &&
        css`
            border-radius: 0 0 0 8px;
            position: absolute;
            top: 0px;
        `}
    ${(props) =>
        !props.isYoutube &&
        css`
            backdrop-filter: blur(4px);
        `}

`

const SupportContainer = styled.div`
    max-height: 600px;
    height: fit-content;
    overflow: scroll;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`
const SupportContainerBox = styled.div`
    max-height: 600px;
    height: fit-content;
    overflow: scroll;

    ::-webkit-scrollbar {
        -webkit-appearance: none;
        width: 10px;
        height: 100%;
        margin: 10px 0px;
    }

    ::-webkit-scrollbar-thumb {
        border-radius: 12px;
        background-color: ${(props) => props.theme.colors.black};
        margin: 10px 10px;
    }
`

const SupportBox = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 10px;
    grid-gap: 5px;
`

const RemoveMenuContainer = styled.div<{
    ribbonPosition
}>`
    display: flex;
    padding: 15px;
    width: 330px;
    flex-direction: column;

    ${(props) =>
        props.ribbonPosition === 'bottomRight' &&
        css`
            flex-direction: column-reverse;
        `}
`
const TutorialContainerBox = styled.div`
    display: flex;
    padding: 20px 20px 0 20px;
    flex-direction: column;
`

const UpdateAvailablePill = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    color: ${(props) =>
        props.theme.variant === 'light'
            ? props.theme.colors.greyscale5
            : props.theme.colors.black};
    background-color: ${(props) => props.theme.colors.prime2};
    border-radius: 30px;
    font-size: 12px;
`

const UpdateAvailableDot = styled.div`
    position: absolute;
    background-color: ${(props) => props.theme.colors.prime2};
    border-radius: 30px;
    height: 12px;
    width: 12px;
    bottom: -2px;
    right: -2px;
`

const SpacesCounter = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: -2px;
    right: -2px;
    height: 14px;
    font-size: 12px;
    width: auto;
    padding: 0 4px;
    color: ${(props) => props.theme.colors.black};
    background-color: ${(props) => props.theme.colors.white};
    border-radius: 30px;
    min-width: 10px;
`
const PillCounter = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 14px;
    font-size: 12px;
    width: auto;
    padding: 0 4px;
    color: ${(props) => props.theme.colors.black};
    background-color: ${(props) => props.theme.colors.white};
    border-radius: 30px;
    min-width: 10px;
`

const SupportTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 18px;
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
    color: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.greyScale6
            : props.theme.colors.greyScale2};
`
const SavedButtonBox = styled.span`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    color: ${(props) => props.theme.colors.greyScale8};

    & > ${DateText} {
        font-size: 12px;
    }
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

const PickerButtonTopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: fill-available;
    margin-left: -7px;
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

const BlockListArea = styled.div<{ ribbonPosition }>`
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    align-items: flex-start;
    margin-bottom: 10px;
    margin-top: 10px;
    padding: 10px 10px 15px 0;

    ${(props) =>
        props.ribbonPosition === 'topRight' &&
        css`
            border-bottom: none;
            margin-bottom: 0px;
        `}
    ${(props) =>
        props.ribbonPosition === 'bottomRight' &&
        css`
            border-top: none;
            margin-top: 0px;
        `}
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
    padding: 0 0 0 15px;
    width: fill-available;
    grid-gap: 5px;
`

const UpperPart = styled.div<{ ribbonPosition; isSidebarOpen }>`
    width: fill-available;

    ${(props) =>
        (props.ribbonPosition === 'topRight' ||
            props.ribbonPosition === 'bottomRight') &&
        css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: fill-available;
        `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: space-between;
            padding: 10px 10px;
        `}
`

const BottomSection = styled.div<{ ribbonPosition; sidebarOpen }>`
    align-self: center;
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;

    ${(props) =>
        (props.ribbonPosition === 'topRight' ||
            props.ribbonPosition === 'bottomRight') &&
        css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-direction: row;
            grid-gap: 15px;
            padding: 0 10px;
        `}

    ${(props) =>
        props.sidebarOpen &&
        css`
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: space-between;
            padding: 10px 10px;
        `}
`

const openAnimation = keyframes`
 0% { padding-bottom: 20px; opacity: 0 }
 100% { padding-bottom: 0px; opacity: 1 }
`

const InnerRibbon = styled.div<{
    isPeeking
    isSidebarOpen
    ribbonPosition
    isYoutube
}>`
    /* right: -40px; */
    position: sticky;
    display: flex;
    line-height: normal;
    text-align: start;
    align-items: center;
    z-index: 2147483644;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    display: none;
    background: ${(props) =>
        props.theme.variant === 'dark'
            ? props.theme.colors.black0
            : props.theme.colors.black + 'c9'};
    outline: 1px solid ${(props) => props.theme.colors.greyScale3};



    // Peeking State
    ${(props) =>
        props.isPeeking &&
        css`
            display: flex;
            align-items: flex-end;
            width: 44px;
            right: 0px;
            height: fit-content;
            transition: all 0.1s cubic-bezier(0.4, 0, 0.16, 0.87);
        }
    `}

    ${(props) =>
        (props.ribbonPosition === 'topRight' ||
            props.ribbonPosition === 'bottomRight') &&
        css<{ isSidebarOpen; isPeeking }>`
            display: flex;
            box-shadow: none;
            justify-content: center;
            height: 44px;
            width: fit-content;
            align-items: flex-start;
            padding: ${(props) => (!props.isPeeking ? '0px' : '0 5px 0 5px;')};
            right: 0px;
            transition: unset;
            flex-direction: row;
            align-items: center;
            transition: all 0.1s cubic-bezier(0.4, 0, 0.16, 0.87);

            & .removeSidebar {
                visibility: hidden;
                display: none;
            }
        `}

        ${(props) =>
            props.ribbonPosition === 'topRight' &&
            props.isPeeking &&
            css`
                border-radius: 0 0 0 8px;
                top: 0px;
            `}
        ${(props) =>
            props.ribbonPosition === 'bottomRight' &&
            props.isPeeking &&
            css`
                border-radius: 8px 0 0 0;
                bottom: 0px;
            `}
        ${(props) =>
            props.ribbonPosition === 'centerRight' &&
            props.isPeeking &&
            css`
                border-radius: 8px;
                width: ${TOOLTIP_WIDTH};
            `}

            ${(props) =>
                props.isSidebarOpen &&
                css`
                    display: flex;
                    box-shadow: none;
                    justify-content: center;
                    height: 100%;
                    flex-direction: column;
                    padding: 0px 0px;
                    width: ${TOOLTIP_WIDTH};
                    align-items: flex-start;
                    right: 0px;
                    transition: unset;
                    border-radius: 0px;
                    justify-content: space-between;
                    outline: 1px solid
                        ${(props) => props.theme.colors.greyScale3};

                    & .removeSidebar {
                        visibility: hidden;
                        display: none;
                    }
                `}

    ${(props) =>
        !props.isYoutube &&
        css`
            backdrop-filter: blur(30px);
        `}


`

const ExtraButtonRow = styled.div<{ deactivateHover? }>`
    height: 40px;
    display: flex;
    grid-gap: 10px;
    align-items: center;
    width: fill-available;
    cursor: pointer;
    border-radius: 3px;
    padding: 0 10px;
    position: relative;

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};
    }

    ${(props) =>
        props.deactivateHover &&
        css`
            cursor: default;

            &:hover {
                outline: none;
            }
        `}
`

const HorizontalLine = styled.div<{ sidebaropen: boolean }>`
    width: 100%;
    margin: 5px 0;
    height: 1px;
    background-color: ${(props) => props.theme.colors.greyScale3};
`
const VerticalLine = styled.div<{ sidebaropen: boolean }>`
    width: 1px;
    background-color: ${(props) => props.theme.colors.greyScale3};
    height: fill-available;
`

const PageAction = styled.div<{ ribbonPosition; isSidebarOpen }>`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    align-items: center;
    justify-content: center;
    padding: 7px 10px 10px 10px;

    ${(props) =>
        (props.ribbonPosition === 'topRight' ||
            props.ribbonPosition === 'bottomRight') &&
        css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0px 10px;
        `}
    ${(props) =>
        props.isSidebarOpen &&
        css`
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: space-between;
            padding: 0px 10px;
        `}
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
    width: 500px;
    height: 580px;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    padding-top: 20px;
    max-width: 800px;
    background: ${(props) => props.theme.colors.black};
    border-radius: 0 0 10px 10px;
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
    font-size: 16px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    font-weight: bold;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
`
const NotificationsTitle = styled.div`
    font-size: 16px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    font-weight: bold;
    justify-content: space-between;
    align-items: center;
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
