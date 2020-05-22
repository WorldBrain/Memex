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

export interface RibbonContainerProps extends RibbonContainerOptions {
    state: 'visible' | 'hidden'
    isSidebarOpen: boolean
    openSidebar: () => void
    closeSidebar: () => void
}

export default class RibbonContainer extends StatefulUIElement<
    RibbonContainerProps,
    RibbonContainerState,
    RibbonContainerEvents
> {
    constructor(props) {
        super(props, new RibbonContainerLogic(props))
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

    handleExternalAction = (event: { action: InPageUIRibbonAction }) => {
        if (event.action === 'comment') {
            this.processEvent('setShowCommentBox', { value: true })
        } else if (event.action === 'bookmark') {
            this.processEvent('toggleBookmark', null)
            this.props.setRibbonShouldAutoHide(true)
        } else if (event.action === 'list') {
            this.processEvent('setShowListsPicker', { value: true })
        } else if (event.action === 'tag') {
            this.processEvent('setShowTagsPicker', { value: true })
        }
    }

    render() {
        return (
            <Ribbon
                isExpanded={this.props.state === 'visible'}
                getRemoteFunction={this.props.getRemoteFunction}
                // annotationsManager={this.props.annotationsManager}
                highlighter={this.props.highlighter}
                isRibbonEnabled={this.state.isRibbonEnabled}
                handleRemoveRibbon={() => this.props.inPageUI.removeRibbon()}
                getUrl={() => this.props.currentTab.url}
                tabId={this.props.currentTab.id}
                handleRibbonToggle={() =>
                    this.processEvent('toggleRibbon', null)
                }
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
                    openSidebar: () => {
                        this.props.openSidebar()
                    },
                    closeSidebar: this.props.closeSidebar,
                }}
                commentBox={{
                    ...this.state.commentBox,
                    handleCommentTextChange: (comment: string) =>
                        this.processEvent('handleCommentTextChange', {
                            value: comment,
                        }),
                    saveComment: () => this.processEvent('saveComment', null),
                    cancelComment: () =>
                        this.processEvent('cancelComment', null),
                    toggleCommentBoxBookmark: () =>
                        this.processEvent('toggleCommentBoxBookmark', null),
                    toggleCommentBoxTagPicker: () =>
                        this.processEvent('toggleCommentBoxTagPicker', null),
                    setShowCommentBox: (value) =>
                        this.processEvent('setShowCommentBox', { value }),
                    updateCommentTags: (value) =>
                        this.processEvent('updateCommentTags', { value }),
                    fetchInitialTagSuggestions: () =>
                        this.props.tags.fetchInitialTagSuggestions(),
                    queryTagSuggestions: (query: string) =>
                        this.props.tags.searchForTagSuggestions({ query }),
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
                    updateTags: (value) =>
                        this.processEvent('updateTags', { value }),
                    fetchInitialTagSuggestions: () =>
                        this.props.tags.fetchInitialTagSuggestions(),
                    fetchInitialTagSelections: () =>
                        this.props.tags.fetchPageTags({
                            url: this.props.currentTab.url,
                        }),
                    queryTagSuggestions: (query: string) =>
                        this.props.tags.searchForTagSuggestions({ query }),
                }}
                lists={{
                    ...this.state.lists,
                    updateLists: (value) =>
                        this.processEvent('updateLists', { value }),
                    setShowListsPicker: (value: false) =>
                        this.processEvent('setShowListsPicker', {
                            value,
                        }),
                    fetchInitialListSuggestions: () =>
                        this.props.customLists.fetchInitialListSuggestions(),
                    fetchInitialListSelections: () =>
                        this.props.customLists.fetchPageLists({
                            url: this.props.currentTab.url,
                        }),
                    queryListSuggestions: (query: string) =>
                        this.props.customLists.searchForListSuggestions({
                            query,
                        }),
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
