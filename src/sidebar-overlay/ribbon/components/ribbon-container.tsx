import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import RootState, { MapDispatchToProps } from '../../types'
import Ribbon from './ribbon'
import * as actions from '../actions'
import * as selectors from '../selectors'

import {
    IndexDropdown,
    AddListDropdownContainer,
} from 'src/common-ui/containers'
import * as pauseActs from 'src/popup/pause-button/actions'
import * as pause from 'src/popup/pause-button/selectors'
import * as tagActs from 'src/popup/tags-button/actions'
import * as tags from 'src/popup/tags-button/selectors'
import * as collectionActs from 'src/popup/collections-button/actions'
import * as collections from 'src/popup/collections-button/selectors'
import * as bookmarkActs from 'src/popup/bookmark-button/actions'
import * as bookmark from 'src/popup/bookmark-button/selectors'
import * as popup from 'src/popup/selectors'
import { PageList } from 'src/custom-lists/background/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import * as sidebarActs from 'src/sidebar-overlay/sidebar/actions'

interface StateProps {
    isExpanded: boolean
    isTooltipEnabled: boolean
    areHighlightsEnabled: boolean
    isPaused: boolean
    isBookmarked: boolean
    tabId: number
    tags: string[]
    initTagSuggs: string[]
    collections: PageList[]
    initCollSuggs: PageList[]
    showCommentBox: boolean
    showSearchBox: boolean
    showTagsPicker: boolean
    showCollectionsPicker: boolean
    searchValue: string
}

interface DispatchProps {
    onInit: () => void
    setAnnotationsManager: (annotationsManager: AnnotationsManager) => void
    handleRibbonToggle: () => void
    handleTooltipToggle: () => void
    handleHighlightsToggle: () => void
    handlePauseToggle: () => void
    handleBookmarkToggle: () => void
    onTagAdd: (tag: string) => void
    onTagDel: (tag: string) => void
    onCollectionAdd: (collection: PageList) => void
    onCollectionDel: (collection: PageList) => void
    setShowCommentBox: (value: boolean) => void
    setShowTagsPicker: (value: boolean) => void
    setShowCollectionsPicker: (value: boolean) => void
    setShowSearchBox: (value: boolean) => void
    setSearchValue: (value: string) => void
    openRibbon: () => void
}

interface OwnProps {
    commentText: string
    isSidebarOpen: boolean
    isRibbonEnabled: boolean
    isCommentSaved: boolean
    annotationsManager: AnnotationsManager
    getUrl: () => string
    setRibbonRef: (e: HTMLElement) => void
    closeSidebar: () => void
    handleRemoveRibbon: () => void
    openSidebar: (args: any) => void
    setShowSidebarCommentBox: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
}

type Props = StateProps & DispatchProps & OwnProps

class RibbonContainer extends Component<Props> {
    componentDidMount() {
        this.props.setAnnotationsManager(this.props.annotationsManager)
    }

    private _handleTooltipToggle = () => {
        this.props.insertOrRemoveTooltip(this.props.isTooltipEnabled)
        this.props.handleTooltipToggle()
    }

    private renderTagsManager() {
        return (
            <IndexDropdown
                env="inpage"
                url={this.props.getUrl()}
                tabId={this.props.tabId}
                initFilters={this.props.tags}
                initSuggestions={this.props.initTagSuggs}
                source="tag"
                onFilterAdd={this.props.onTagAdd}
                onFilterDel={this.props.onTagDel}
                isForRibbon
            />
        )
    }

    private renderCollectionsManager() {
        return (
            <AddListDropdownContainer
                env="inpage"
                url={this.props.getUrl()}
                initLists={this.props.collections}
                initSuggestions={this.props.initCollSuggs}
                onFilterAdd={this.props.onCollectionAdd}
                onFilterDel={this.props.onCollectionDel}
                isForRibbon
            />
        )
    }

    render() {
        return (
            <div ref={this.props.setRibbonRef}>
                <Ribbon
                    {...this.props}
                    tagManager={this.renderTagsManager()}
                    collectionsManager={this.renderCollectionsManager()}
                    handleTooltipToggle={this._handleTooltipToggle}
                />
            </div>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    isExpanded: selectors.isExpanded(state),
    isTooltipEnabled: selectors.isTooltipEnabled(state),
    areHighlightsEnabled: selectors.areHighlightsEnabled(state),
    showCollectionsPicker: selectors.showCollectionsPicker(state),
    showCommentBox: selectors.showCommentBox(state),
    showSearchBox: selectors.showSearchBox(state),
    showTagsPicker: selectors.showTagsPicker(state),
    searchValue: selectors.searchValue(state),
    isPaused: pause.isPaused(state),
    isBookmarked: bookmark.isBookmarked(state),
    tabId: popup.tabId(state),
    tags: tags.tags(state),
    initTagSuggs: tags.initTagSuggestions(state),
    collections: collections.collections(state),
    initCollSuggs: collections.initCollSuggestions(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    onInit: () => dispatch(actions.initState()),
    openRibbon: () => dispatch(actions.setIsExpanded(true)),
    setAnnotationsManager: annotationsManager =>
        dispatch(sidebarActs.setAnnotationsManager(annotationsManager)),
    handleRibbonToggle: () => dispatch(actions.toggleRibbon()),
    handleTooltipToggle: () => dispatch(actions.toggleTooltip()),
    handleHighlightsToggle: () => dispatch(actions.toggleHighlights()),
    handlePauseToggle: () => dispatch(pauseActs.togglePaused()),
    handleBookmarkToggle: () => dispatch(bookmarkActs.toggleBookmark()),
    onTagAdd: (tag: string) => dispatch(tagActs.addTagToPage(tag)),
    onTagDel: (tag: string) => dispatch(tagActs.deleteTag(tag)),
    onCollectionAdd: (collection: PageList) =>
        dispatch(collectionActs.addCollectionToPage(collection)),
    onCollectionDel: (collection: PageList) =>
        dispatch(collectionActs.deleteCollection(collection)),
    setSearchValue: (value: string) => dispatch(actions.setSearchValue(value)),
    setShowCommentBox: (value: boolean) =>
        dispatch(actions.setShowCommentBox(value)),
    setShowSearchBox: (value: boolean) =>
        dispatch(actions.setShowSearchBox(value)),
    setShowTagsPicker: (value: boolean) =>
        dispatch(actions.setShowTagsPicker(value)),
    setShowCollectionsPicker: (value: boolean) =>
        dispatch(actions.setShowCollsPicker(value)),
})

export default connect(mapStateToProps, mapDispatchToProps)(RibbonContainer)
