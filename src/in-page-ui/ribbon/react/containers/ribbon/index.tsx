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
import { normalizeUrl } from '@worldbrain/memex-url-utils'

export interface RibbonContainerProps extends RibbonContainerOptions {
    state: 'visible' | 'hidden'
    isSidebarOpen: boolean
    setRef?: (el: HTMLElement) => void
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
                focusCreateForm: () =>
                    this.ribbonRef?.current?.focusCreateForm(),
            }),
        )
    }

    private get normalizedPageUrl(): string | null {
        return this.state.pageUrl ? normalizeUrl(this.state.pageUrl) : null
    }

    componentDidMount() {
        super.componentDidMount()
        this.props.inPageUI.events.on('ribbonAction', this.handleExternalAction)
    }

    componentWillUnmount() {
        super.componentWillUnmount()
        this.props.inPageUI.events.removeListener(
            'ribbonAction',
            this.handleExternalAction,
        )
    }

    componentDidUpdate(prevProps: RibbonContainerProps) {
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

    handleExternalAction = (event: { action: InPageUIRibbonAction }) => {
        if (event.action === 'comment') {
            this.processEvent('setShowCommentBox', { value: true })
        } else if (event.action === 'bookmark') {
            this.processEvent('toggleBookmark', null)
            this.props.setRibbonShouldAutoHide(true)
        } else if (event.action === 'list') {
            this.processEvent('setShowListsPicker', { value: true })
        } else if (event.action === 'tag') {
            // This serves to temporary "disable" the shortcut until we remove tags UI
            if (!this.state.tagging.shouldShowTagsUIs) {
                this.props.inPageUI.hideRibbon()
            } else {
                this.processEvent('setShowTagsPicker', { value: true })
            }
        }
    }

    render() {
        return (
            <Ribbon
                contentSharingBG={this.props.contentSharing}
                spacesBG={this.props.customLists}
                ref={this.ribbonRef}
                setRef={this.props.setRef}
                getListDetailsById={(id) => {
                    const { annotationsCache } = this.props
                    return {
                        name:
                            annotationsCache.listData[id]?.name ??
                            'Missing list',
                        isShared:
                            annotationsCache.listData[id]?.remoteId != null,
                    }
                }}
                toggleShowExtraButtons={() => {
                    this.processEvent('toggleShowExtraButtons', null)
                }}
                toggleShowTutorial={() => {
                    this.processEvent('toggleShowTutorial', null)
                }}
                showExtraButtons={this.state.areExtraButtonsShown}
                showTutorial={this.state.areTutorialShown}
                isExpanded={this.props.state === 'visible'}
                getRemoteFunction={this.props.getRemoteFunction}
                // annotationsManager={this.props.annotationsManager}
                highlighter={this.props.highlighter}
                isRibbonEnabled={this.state.isRibbonEnabled}
                handleRemoveRibbon={() => this.props.inPageUI.removeRibbon()}
                handleRibbonToggle={() =>
                    this.processEvent('toggleRibbon', null)
                }
                activityIndicator={{
                    activityIndicatorBG: this.props.activityIndicatorBG,
                    openFeedUrl: () => window.open(this.whichFeed(), '_blank'),
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
                    setShowSidebarCommentBox: () =>
                        this.props.inPageUI.showSidebar({ action: 'comment' }),
                    openSidebar: this.handleSidebarOpen,
                    closeSidebar: () => this.props.inPageUI.hideSidebar(),
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
                tagging={{
                    ...this.state.tagging,
                    setShowTagsPicker: (value) =>
                        this.processEvent('setShowTagsPicker', { value }),
                    tagAllTabs: (value) =>
                        this.processEvent('tagAllTabs', { value }),
                    updateTags: (value) =>
                        this.processEvent('updateTags', { value }),
                    fetchInitialTagSelections: () =>
                        this.props.tags.fetchPageTags({
                            url: this.normalizedPageUrl,
                        }),
                    queryEntries: (query) =>
                        this.props.tags.searchForTagSuggestions({ query }),
                    loadDefaultSuggestions: this.props.tags
                        .fetchInitialTagSuggestions,
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
                    createNewEntry: async (name) => {
                        const listId = await this.props.customLists.createCustomList(
                            { name },
                        )
                        this.props.annotationsCache.addNewListData({
                            name,
                            id: listId,
                            remoteId: null,
                        })
                        await this.processEvent('updateLists', {
                            value: {
                                added: listId,
                                deleted: null,
                                selected: [],
                            },
                        })
                        return listId
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
            />
        )
    }
}
