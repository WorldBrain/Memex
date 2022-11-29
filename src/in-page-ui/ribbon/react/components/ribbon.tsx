import React, { Component, createRef, KeyboardEventHandler } from 'react'
import qs from 'query-string'
import styled, { css } from 'styled-components'

import extractQueryFilters from 'src/util/nlp-time-filter'
import { ButtonTooltip } from 'src/common-ui/components/'
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
import { RibbonSubcomponentProps } from './types'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import AnnotationCreate from 'src/annotations/components/AnnotationCreate'
import BlurredSidebarOverlay from 'src/in-page-ui/sidebar/react/components/blurred-overlay'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { FeedActivityDot } from 'src/activity-indicator/ui'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import type { ListDetailsGetter } from 'src/annotations/types'
import ExtraButtonsPanel from './extra-buttons-panel'
import FeedPanel from './feed-panel'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { NewHoverBox } from '@worldbrain/memex-common/lib/common-ui/components/hover-box'
import { addUrlToBlacklist } from 'src/blacklist/utils'

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
    highlighter: Pick<HighlightInteractionsInterface, 'removeHighlights'>
    hideOnMouseLeave?: boolean
    toggleFeed: () => void
    showFeed: boolean
}

interface State {
    shortcutsReady: boolean
    blockListValue: string
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
    private annotationCreateRef // TODO: Figure out how to properly type refs to onClickOutside HOCs

    private spacePickerRef = createRef<HTMLDivElement>()
    private settingsButtonRef = createRef<HTMLDivElement>()
    private tutorialButtonRef = createRef<HTMLDivElement>()
    private feedButtonRef = createRef<HTMLDivElement>()
    private sidebarButtonRef = createRef<HTMLDivElement>()

    state: State = {
        shortcutsReady: false,
        blockListValue: this.getDomain(window.location.href),
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
    }

    async componentDidMount() {
        this.keyboardShortcuts = await getKeyboardShortcutsState()
        this.setState(() => ({ shortcutsReady: true }))
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

    private getTooltipText(name: string): string {
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

        return short.shortcut && short.enabled
            ? `${source} (${short.shortcut})`
            : source
    }

    private hideListPicker = () => {
        this.props.lists.setShowListsPicker(false)
    }

    private renderCollectionsPicker() {
        return (
            <CollectionPicker
                {...this.props.lists}
                spacesBG={this.props.spacesBG}
                contentSharingBG={this.props.contentSharingBG}
                actOnAllTabs={this.props.lists.listAllTabs}
                initialSelectedListIds={
                    this.props.lists.fetchInitialListSelections
                }
                onEscapeKeyDown={this.hideListPicker}
                handleClickOutside={this.hideListPicker}
            />
        )
    }

    private renderTutorial() {
        if (!this.props.showTutorial) {
            return
        }

        return (
            <BlurredSidebarOverlay
                onOutsideClick={() => this.props.toggleShowTutorial()}
                skipRendering={!this.props.sidebar.isSidebarOpen}
            >
                <QuickTutorial
                    getKeyboardShortcutsState={getKeyboardShortcutsState}
                    onClickOutside={() => this.props.toggleShowTutorial()}
                    onSettingsClick={() => this.openOptionsTabRPC('settings')}
                    onEscapeKeyDown={() => this.props.toggleShowTutorial()}
                />
            </BlurredSidebarOverlay>
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
            <BlurredSidebarOverlay
                onOutsideClick={() => this.props.toggleFeed()}
                skipRendering={!this.props.sidebar.isSidebarOpen}
            >
                <FeedPanel closePanel={() => this.props.toggleFeed()}>
                    <FeedContainer>
                        <TitleContainer>
                            <Icon
                                heightAndWidth="30px"
                                filePath="feed"
                                hoverOff
                            />
                            <TitleContent>
                                <SectionTitle>Activity Feed</SectionTitle>
                                <SectionDescription>
                                    Updates from Spaces you follow or
                                    conversation you participate in
                                </SectionDescription>
                            </TitleContent>
                        </TitleContainer>
                        <FeedFrame src={this.whichFeed()} />
                    </FeedContainer>
                </FeedPanel>
            </BlurredSidebarOverlay>
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

    private renderExtraButtons() {
        if (!this.props.showExtraButtons) {
            return
        }

        return (
            <BlurredSidebarOverlay
                onOutsideClick={() => this.props.toggleShowExtraButtons()}
                skipRendering={!this.props.sidebar.isSidebarOpen}
            >
                <ExtraButtonsPanel
                    closePanel={() => this.props.toggleShowExtraButtons()}
                >
                    <BlockListArea>
                        <BlockListTitleArea>
                            <Icon
                                filePath={'block'}
                                heightAndWidth="16px"
                                hoverOff
                            />
                            <InfoText>Disable Ribbon on this site</InfoText>
                            <Icon
                                onClick={() =>
                                    this.openOptionsTabRPC('blocklist')
                                }
                                filePath={'settings'}
                                heightAndWidth={'14px'}
                                color={'purple'}
                            />
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
                            <Icon
                                heightAndWidth="22px"
                                filePath="plus"
                                color="purple"
                                onClick={async () => {
                                    this.setState({
                                        blockListValue: 'Added to block list',
                                    })
                                    await addUrlToBlacklist(
                                        this.state.blockListValue,
                                    )
                                    setTimeout(
                                        () => this.props.handleRemoveRibbon(),
                                        2000,
                                    )
                                }}
                            />
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
                            <InfoText>Disable Ribbon</InfoText>
                        ) : (
                            <InfoText>Enable Ribbon</InfoText>
                        )}
                    </ExtraButtonRow>
                    <ExtraButtonRow
                        onClick={this.props.highlights.handleHighlightsToggle}
                    >
                        <Icon
                            filePath={
                                this.props.highlights.areHighlightsEnabled
                                    ? icons.highlighterFull
                                    : icons.highlighterEmpty
                            }
                            heightAndWidth="22px"
                            hoverOff
                        />
                        {this.props.isRibbonEnabled ? (
                            <InfoText>Hide Highlights</InfoText>
                        ) : (
                            <InfoText>Show Highlights</InfoText>
                        )}
                    </ExtraButtonRow>

                    <ExtraButtonRow
                        onClick={this.props.tooltip.handleTooltipToggle}
                    >
                        <Icon
                            filePath={
                                this.props.tooltip.isTooltipEnabled
                                    ? icons.tooltipOn
                                    : icons.tooltipOff
                            }
                            heightAndWidth="22px"
                            hoverOff
                        />
                        {this.props.isRibbonEnabled ? (
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
                            heightAndWidth="16px"
                            hoverOff
                        />
                        <InfoText>Settings</InfoText>
                    </ExtraButtonRow>
                    <ExtraButtonRow
                        onClick={() =>
                            window.open('https://worldbrain.io/feedback')
                        }
                    >
                        <Icon
                            filePath={icons.sadFace}
                            heightAndWidth="16px"
                            hoverOff
                        />
                        <InfoText>Feature Requests & Bugs</InfoText>
                    </ExtraButtonRow>
                </ExtraButtonsPanel>
            </BlurredSidebarOverlay>
        )
    }

    renderCommentBox() {
        return (
            <CommentBoxContainer
                hasComment={this.props.commentBox.commentText.length > 0}
            >
                <AnnotationCreate
                    ref={(ref) => (this.annotationCreateRef = ref)}
                    hide={() => this.props.commentBox.setShowCommentBox(false)}
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
        )
    }

    render() {
        if (!this.state.shortcutsReady) {
            return false
        }

        return (
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
                        <React.Fragment>
                            <UpperPart>
                                <NewHoverBox
                                    referenceEl={this.feedButtonRef.current}
                                    componentToOpen={
                                        this.props.showFeed
                                            ? this.renderFeedInfo()
                                            : null
                                    }
                                    tooltipText={this.getTooltipText(
                                        'addToCollection',
                                    )}
                                    placement={'left-start'}
                                    offsetX={10}
                                    width={'600px'}
                                    closeComponent={() =>
                                        this.props.toggleFeed()
                                    }
                                    bigClosingScreen
                                >
                                    <FeedIndicatorBox
                                        isSidebarOpen={
                                            this.props.sidebar.isSidebarOpen
                                        }
                                        onClick={() => this.props.toggleFeed()}
                                    >
                                        <FeedActivityDot
                                            key="activity-feed-indicator"
                                            {...this.props.activityIndicator}
                                        />
                                    </FeedIndicatorBox>
                                </NewHoverBox>
                                <HorizontalLine
                                    sidebaropen={
                                        this.props.sidebar.isSidebarOpen
                                    }
                                />
                                <PageAction>
                                    <ButtonTooltip
                                        tooltipText={this.getTooltipText(
                                            'createBookmark',
                                        )}
                                        position="leftNarrow"
                                    >
                                        <Icon
                                            onClick={() =>
                                                this.props.bookmark.toggleBookmark()
                                            }
                                            color={
                                                this.props.bookmark.isBookmarked
                                                    ? 'purple'
                                                    : 'greyScale9'
                                            }
                                            heightAndWidth="22px"
                                            filePath={
                                                this.props.bookmark.isBookmarked
                                                    ? icons.heartFull
                                                    : icons.heartEmpty
                                            }
                                        />
                                    </ButtonTooltip>
                                    <NewHoverBox
                                        referenceEl={
                                            this.spacePickerRef.current
                                        }
                                        componentToOpen={
                                            this.props.lists.showListsPicker
                                                ? this.renderCollectionsPicker()
                                                : null
                                        }
                                        tooltipText={this.getTooltipText(
                                            'addToCollection',
                                        )}
                                        placement={'left-start'}
                                        offsetX={10}
                                        closeComponent={this.hideListPicker}
                                        bigClosingScreen
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
                                                    ? 'purple'
                                                    : 'greyScale9'
                                            }
                                            heightAndWidth="22px"
                                            filePath={
                                                this.props.lists.pageListIds
                                                    .length > 0
                                                    ? icons.collectionsFull
                                                    : icons.collectionsEmpty
                                            }
                                            ref={this.spacePickerRef}
                                        />
                                    </NewHoverBox>
                                    {!this.props.sidebar.isSidebarOpen && (
                                        <NewHoverBox
                                            referenceEl={
                                                this.sidebarButtonRef.current
                                            }
                                            componentToOpen={
                                                this.props.commentBox
                                                    .showCommentBox
                                                    ? this.renderCommentBox()
                                                    : null
                                            }
                                            tooltipText={this.getTooltipText(
                                                'toggleSidebar',
                                            )}
                                            placement={'left-start'}
                                            offsetX={10}
                                            bigClosingScreen
                                        >
                                            <Icon
                                                onClick={(e) =>
                                                    this.handleCommentIconBtnClick(
                                                        e,
                                                    )
                                                }
                                                color={'greyScale9'}
                                                heightAndWidth="22px"
                                                filePath={
                                                    this.props.commentBox
                                                        .isCommentSaved
                                                        ? icons.saveIcon
                                                        : // : this.props.hasAnnotations
                                                          // ? icons.commentFull
                                                          icons.commentEmpty
                                                }
                                            />
                                        </NewHoverBox>
                                    )}
                                    <ButtonTooltip
                                        tooltipText={this.getTooltipText(
                                            'openDashboard',
                                        )}
                                        position="leftNarrow"
                                    >
                                        <Icon
                                            onClick={() =>
                                                this.openOverviewTabRPC()
                                            }
                                            color={'greyScale9'}
                                            heightAndWidth="22px"
                                            filePath={icons.searchIcon}
                                        />
                                    </ButtonTooltip>
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
                                sidebaropen={this.props.sidebar.isSidebarOpen}
                            >
                                <NewHoverBox
                                    referenceEl={this.settingsButtonRef.current}
                                    componentToOpen={
                                        this.props.showExtraButtons
                                            ? this.renderExtraButtons()
                                            : null
                                    }
                                    tooltipText={'Settings'}
                                    placement={'left-start'}
                                    offsetX={10}
                                    closeComponent={
                                        this.props.toggleShowExtraButtons
                                    }
                                    bigClosingScreen
                                    width={'300px'}
                                >
                                    <Icon
                                        onClick={() =>
                                            this.props.toggleShowExtraButtons()
                                        }
                                        color={'darkText'}
                                        heightAndWidth="22px"
                                        filePath={icons.settings}
                                        ref={this.settingsButtonRef}
                                    />
                                </NewHoverBox>
                                <NewHoverBox
                                    referenceEl={this.tutorialButtonRef.current}
                                    componentToOpen={
                                        this.props.showTutorial
                                            ? this.renderTutorial()
                                            : null
                                    }
                                    tooltipText={'Tutorial'}
                                    placement={'left-start'}
                                    offsetX={10}
                                    closeComponent={
                                        this.props.toggleShowTutorial
                                    }
                                    width={'420px'}
                                    bigClosingScreen
                                >
                                    <Icon
                                        onClick={() =>
                                            this.props.toggleShowTutorial()
                                        }
                                        color={'darkText'}
                                        heightAndWidth="22px"
                                        filePath={icons.helpIcon}
                                        ref={this.tutorialButtonRef}
                                    />
                                </NewHoverBox>
                                {!this.props.sidebar.isSidebarOpen && (
                                    <ButtonTooltip
                                        tooltipText={
                                            <span>
                                                Close sidebar this once.
                                                <br />
                                                <SubText>
                                                    Shift+Click to disable.
                                                </SubText>
                                            </span>
                                        }
                                        position="leftNarrow"
                                    >
                                        <Icon
                                            onClick={(event) => {
                                                if (
                                                    event.shiftKey &&
                                                    this.props.isRibbonEnabled
                                                ) {
                                                    this.props.handleRibbonToggle()
                                                } else {
                                                    this.props.handleRemoveRibbon()
                                                }
                                            }}
                                            color={'darkText'}
                                            heightAndWidth="22px"
                                            filePath={icons.removeX}
                                        />
                                    </ButtonTooltip>
                                )}
                            </BottomSection>
                        </React.Fragment>
                    )}
                </InnerRibbon>
            </OuterRibbon>
        )
    }
}

const BlockListArea = styled.div`
    padding: 0px 10px 15px 5px;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightHover};
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    align-items: flex-start;
    margin-bottom: 5px;
`

const BlockListTitleArea = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    padding: 0px 10px 5px 10px;
`

const TextBoxArea = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
    width: fill-available;
    grid-gap: 5px;
`

const UpperPart = styled.div``

const BottomSection = styled.div<{ sidebaropen: boolean }>`
    align-self: center;
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
`

const OuterRibbon = styled.div<{ isPeeking; isSidebarOpen }>`
    flex-direction: column;
    justify-content: center;
    align-self: center;
    width: 24px;
    height: 400px;
    display: flex;
    /* box-shadow: -1px 2px 5px 0px rgba(0, 0, 0, 0.16); */
    line-height: normal;
    text-align: start;
    align-items: center;
    background: transparent;
    z-index: 2147483644;
    animation: slide-in ease-out;
    animation-duration: 0.05s;

    ${(props) =>
        props.isPeeking &&
        css`
            display: flex;
            align-items: flex-end;
            width: 44px;
            padding-right: 25px;
        `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            display: none;
            box-shadow: none;
            justify-content: center;
            height: 105vh;
            width: 40px;
            border-left: 1px solid ${(props) => props.theme.colors.lineGrey};
            align-items: flex-start;
            padding: 0 5px;
            background: ${(props) => props.theme.colors.backgroundColor};

            & .removeSidebar {
                visibility: hidden;
                display: none;
            }
        `}

        @keyframes slide-in {
        0% {
            right: -600px;
            opacity: 0%;
        }
        100% {
            right: 0px;
            opacity: 100%;
        }
    }
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
    background: ${(props) => props.theme.colors.backgroundColorDarker};
    border: 1px solid ${(props) => props.theme.colors.lineGrey};

    ${(props) =>
        props.isPeeking &&
        css`
            border-radius: 8px;
            display: flex;
            box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
            background: ${(props) => props.theme.colors.backgroundColorDarker};
        }
    `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            display: none;
            box-shadow: none;
            height: 90%;
            top: 0px;
            width: 40px;
            justify-content: space-between;
            padding-top: 17px;
            background: transparent;
            border: none;
            align-items: center;
            background: ${(props) => props.theme.colors.backgroundColor};
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

    &:hover {
        background: ${(props) => props.theme.colors.backgroundColorDarker};
    }
`

const HorizontalLine = styled.div<{ sidebaropen: boolean }>`
    width: 100%;
    margin: 5px 0;
    height: 1px;
    background-color: ${(props) => props.theme.colors.lightHover};
`

const PageAction = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: row;
    align-items: center;
    justify-content: center;
    padding: 10px;
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
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 400;
`

const FeedFrame = styled.iframe`
    width: fill-available;
    height: 600px;
    border: none;
    border-radius: 10px;
`

const FeedContainer = styled.div`
    display: flex;
    width: fill-available;
    height: 580px;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    grid-gap: 20px;
    padding-top: 20px;
    max-width: 800px;
    background: ${(props) => props.theme.colors.backgroundColor};
    border-radius: 10px;
`

const TitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 15px;
    width: fill-available;
    padding: 0 20px 20px 20px;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightHover};
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
    color: ${(props) => props.theme.colors.normalText};
    font-size: 20px;
    font-weight: bold;
`
const SectionDescription = styled.div`
    color: ${(props) => props.theme.colors.greyScale8};
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
