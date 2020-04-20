import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Ribbon from './ribbon'

import {
    IndexDropdown,
    AddListDropdownContainer,
} from 'src/common-ui/containers'
import { selectors as pause, acts as pauseActs } from 'src/popup/pause-button'
import { acts as tagActs, selectors as tags } from 'src/popup/tags-button'
import {
    selectors as collections,
    acts as collectionActs,
} from 'src/popup/collections-button'
import {
    acts as bookmarkActs,
    selectors as bookmark,
} from 'src/popup/bookmark-button'
import { PageList } from 'src/custom-lists/background/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { HighlightInteractionInterface } from 'src/highlighting/types'

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
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    highlighter: Pick<HighlightInteractionInterface, 'removeHighlights'>
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

export default class RibbonContainer extends Component<Props> {
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
