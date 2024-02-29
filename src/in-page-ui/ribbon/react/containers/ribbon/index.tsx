import * as React from 'react'
import {
    RibbonContainerOptions,
    RibbonContainerState,
    RibbonContainerLogic,
    RibbonContainerEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import Ribbon from '../../components/ribbon'
import { InPageUIRibbonAction } from 'src/in-page-ui/shared-state/types'
import analytics from 'src/analytics'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'

export interface RibbonContainerProps extends RibbonContainerOptions {
    state: 'visible' | 'hidden'
    isSidebarOpen: boolean
    setRef?: (el: HTMLElement) => void
    ribbonPosition: 'topRight' | 'bottomRight' | 'centerRight'
    selectRibbonPositionOption: (option) => void
    analyticsBG: AnalyticsCoreInterface
    theme: MemexThemeVariant
}

export default class RibbonContainer extends StatefulUIElement<
    RibbonContainerProps,
    RibbonContainerState,
    RibbonContainerEvents
> {
    private ribbonRef = React.createRef<Ribbon>()

    constructor(props) {
        super(
            props,
            new RibbonContainerLogic({
                ...props,
                analytics,
                analyticsBG: props.analyticsBG,
                focusCreateForm: () =>
                    this.ribbonRef?.current?.focusCreateForm(),
            }),
        )
    }

    private get normalizedPageUrl(): string | null {
        return this.state.fullPageUrl
            ? normalizeUrl(this.state.fullPageUrl)
            : null
    }

    async componentDidMount() {
        await super.componentDidMount()
        this.props.inPageUI.events.on('ribbonAction', this.handleExternalAction)
    }

    async componentWillUnmount() {
        await super.componentWillUnmount()
        this.props.inPageUI.events.removeListener(
            'ribbonAction',
            this.handleExternalAction,
        )
    }

    componentDidUpdate(prevProps: RibbonContainerProps) {
        // if (
        //     !this.props.inPageUI.componentsShown.ribbon &&
        //     this.state.showRemoveMenu
        // ) {
        //     this.processEvent('toggleRemoveMenu', false)
        // }
        const { currentTab } = this.props

        if (currentTab.url !== prevProps.currentTab.url) {
            this.processEvent('hydrateStateFromDB', { url: currentTab.url })
        }
    }

    private whichFeed = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.social/feed'
        } else {
            return 'https://staging.memex.social/feed'
        }
    }

    private handleSidebarOpen = () => {
        if (this.state.commentBox.showCommentBox) {
            this.processEvent('cancelComment', null)
        }

        this.props.inPageUI.showSidebar({
            action: 'comment',
            annotationData: {
                commentText: this.state.commentBox.commentText,
                tags: this.state.commentBox.tags,
            },
        })
    }
    private handleSidebarOpenInFocusMode = (listId) => {
        this.props.inPageUI.showSidebar({
            action: 'set_focus_mode',
            listId,
        })
    }
    private handlePageShare = () => {
        this.props.inPageUI.showSidebar({
            action: 'cite_page',
        })
    }

    handleExternalAction = (event: { action: InPageUIRibbonAction }) => {
        if (event.action === 'comment') {
            this.processEvent('setShowCommentBox', { value: true })
        } else if (event.action === 'bookmark') {
            this.processEvent('toggleBookmark', null)
            this.props.setRibbonShouldAutoHide(true)
        } else if (event.action === 'list') {
            this.processEvent('setShowListsPicker', { value: true })
        }
    }

    render() {
        return (
            <Ribbon
                getRootElement={this.props.getRootElement}
                setWriteError={() =>
                    this.processEvent('setWriteError', {
                        error: null,
                    })
                }
                isTrial={this.state.isTrial}
                showRabbitHoleButton={this.state.showRabbitHoleButton}
                signupDate={this.state.signupDate}
                pageActivityIndicatorBG={this.props.pageActivityIndicatorBG}
                contentSharingBG={this.props.contentSharing}
                analyticsBG={this.props.analyticsBG}
                annotationsCache={this.props.annotationsCache}
                bgScriptBG={this.props.bgScriptBG}
                spacesBG={this.props.customLists}
                authBG={this.props.authBG}
                theme={this.state.themeVariant || this.props.theme}
                toggleTheme={() => {
                    this.processEvent('toggleTheme', {
                        themeVariant:
                            this.state.themeVariant || this.props.theme,
                    })
                }}
                ref={this.ribbonRef}
                setRef={this.props.setRef}
                getListDetailsById={(id) => {
                    const listDetails = this.props.annotationsCache.getListByLocalId(
                        id,
                    )
                    return {
                        name: listDetails?.name ?? 'Missing list',
                        isShared: listDetails?.remoteId != null,
                        type: listDetails?.type ?? null,
                    }
                }}
                toggleShowExtraButtons={() => {
                    this.processEvent('toggleShowExtraButtons', null)
                }}
                toggleRemoveMenu={() => {
                    this.processEvent(
                        'toggleRemoveMenu',
                        !this.state.showRemoveMenu,
                    )
                }}
                toggleAskAI={() => {
                    this.processEvent('toggleAskAI', null)
                }}
                toggleRabbitHole={() => {
                    this.processEvent('toggleRabbitHole', null)
                }}
                toggleQuickSearch={() => {
                    this.processEvent('toggleQuickSearch', null)
                }}
                toggleShowTutorial={() => {
                    this.processEvent('toggleShowTutorial', null)
                }}
                showExtraButtons={this.state.areExtraButtonsShown}
                showRemoveMenu={this.state.showRemoveMenu}
                showTutorial={this.state.areTutorialShown}
                ribbonPosition={this.props.ribbonPosition}
                hasFeedActivity={this.state.hasFeedActivity}
                showFeed={this.state.showFeed}
                toggleFeed={() => {
                    this.processEvent('toggleFeed', null)
                }}
                isExpanded={
                    this.props.state === 'visible' ||
                    !!this.state.bookmark.writeError
                }
                setTutorialIdToOpen={(id) => {
                    this.processEvent('setTutorialId', { tutorialIdToOpen: id })
                }}
                tutorialIdToOpen={this.state.tutorialIdToOpen}
                // annotationsManager={this.props.annotationsManager}
                highlighter={this.props.highlighter}
                isRibbonEnabled={this.state.isRibbonEnabled}
                handleRemoveRibbon={() => this.props.inPageUI.removeRibbon()}
                handleRibbonToggle={() =>
                    this.processEvent('toggleRibbon', null)
                }
                activityIndicator={{
                    activityIndicatorBG: this.props.activityIndicatorBG,
                    //openFeedUrl: () => window.open(this.whichFeed(), '_blank'),
                }}
                highlights={{
                    ...this.state.highlights,
                    handleHighlightsToggle: () =>
                        this.processEvent('handleHighlightsToggle', null),
                }}
                tooltip={{
                    ...this.state.tooltip,
                    handleTooltipToggle: () =>
                        this.processEvent('handleTooltipToggle', null),
                }}
                sidebar={{
                    isSidebarOpen: this.props.isSidebarOpen,
                    isWidthLocked: this.state.isWidthLocked,
                    setShowSidebarCommentBox: () =>
                        this.props.inPageUI.showSidebar({ action: 'comment' }),
                    openSidebar: this.handleSidebarOpen,
                    handleSidebarOpenInFocusMode: this
                        .handleSidebarOpenInFocusMode,
                    sharePage: this.handlePageShare,
                    closeSidebar: () => this.props.inPageUI.hideSidebar(),
                    toggleReadingView: () =>
                        this.processEvent('toggleReadingView', null),
                }}
                commentBox={{
                    ...this.state.commentBox,
                    saveComment: (shouldShare, isProtected) =>
                        this.processEvent('saveComment', {
                            shouldShare,
                            isProtected,
                        }),
                    cancelComment: () =>
                        this.processEvent('cancelComment', null),
                    setShowCommentBox: (value) =>
                        this.processEvent('setShowCommentBox', { value }),
                    changeComment: (value) =>
                        this.processEvent('changeComment', { value }),
                    updateCommentBoxTags: (value) =>
                        this.processEvent('updateCommentBoxTags', { value }),
                    updateCommentBoxLists: (value) =>
                        this.processEvent('updateCommentBoxLists', { value }),
                }}
                bookmark={{
                    ...this.state.bookmark,
                    toggleBookmark: () =>
                        this.processEvent('toggleBookmark', null),
                }}
                lists={{
                    ...this.state.lists,
                    listAllTabs: (value) =>
                        this.processEvent('listAllTabs', { value }),
                    updateLists: (value) =>
                        this.processEvent('updateLists', { value }),
                    setShowListsPicker: (value: false) =>
                        this.processEvent('setShowListsPicker', {
                            value,
                        }),
                    fetchInitialListSelections: () =>
                        this.props.customLists.fetchPageLists({
                            url: this.normalizedPageUrl,
                        }),
                    selectEntry: (id) =>
                        this.processEvent('updateLists', {
                            value: { added: id, deleted: null, selected: [] },
                        }),
                    unselectEntry: (id) =>
                        this.processEvent('updateLists', {
                            value: { added: null, deleted: id, selected: [] },
                        }),
                    onSpaceCreate: async ({ localListId }) => {
                        await this.processEvent('updateLists', {
                            value: {
                                added: localListId,
                                deleted: null,
                                selected: [],
                            },
                        })
                    },
                }}
                search={{
                    ...this.state.search,
                    setShowSearchBox: (value: false) =>
                        this.processEvent('setShowSearchBox', { value }),
                    setSearchValue: (value: string) =>
                        this.processEvent('setSearchValue', { value }),
                }}
                pausing={{
                    ...this.state.pausing,
                    handlePauseToggle: () =>
                        this.processEvent('handlePauseToggle', null),
                }}
                openPDFinViewer={() => {
                    this.processEvent('openPDFinViewer', null)
                }}
                selectRibbonPositionOption={
                    (option) => this.props.selectRibbonPositionOption(option)

                    // this.processEvent('selectRibbonPositionOption', option)
                }
            />
        )
    }
}
