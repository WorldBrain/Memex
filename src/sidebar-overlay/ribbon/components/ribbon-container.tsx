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
import * as popup from 'src/popup/selectors'
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
import AnnotationsManager from 'src/sidebar-common/annotations-manager'
import { actions as sidebarActs } from 'src/sidebar-common/sidebar/'

interface StateProps {
    isExpanded: boolean
    isTooltipEnabled: boolean
    isPaused: boolean
    isBookmarked: boolean
    url: string
    tags: string[]
    initTagSuggs: string[]
    collections: PageList[]
    initCollSuggs: PageList[]
    showCommentBox: boolean
    showSearchBox: boolean
    showTagsPicker: boolean
    showCollectionsPicker: boolean
    showHighlights?: boolean
    searchValue: string
}

interface DispatchProps {
    onInit: () => void
    setAnnotationsManager: (annotationsManager: AnnotationsManager) => void
    handleRibbonToggle: () => void
    handleTooltipToggle: () => void
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
    setShowHighlights: (value: boolean) => void
    setSearchValue: (value: string) => void
    openRibbon: () => void
    closeRibbon: () => void
}

interface OwnProps {
    closeTimeoutMs?: number
    commentText: string
    isSidebarOpen: boolean
    isRibbonEnabled: boolean
    isCommentSaved: boolean
    annotationsManager: AnnotationsManager
    closeSidebar: () => void
    handleRemoveRibbon: () => void
    openSidebar: (args: any) => void
    setShowSidebarCommentBox: () => void
    insertOrRemoveTooltip: (isTooltipEnabled: boolean) => void
}

type Props = StateProps & DispatchProps & OwnProps

class RibbonContainer extends Component<Props> {
    static defaultProps = { closeTimeoutMs: 1000 }

    private mouseInsideRibbon: boolean
    private ribbonRef: HTMLElement
    private timeoutId

    componentDidMount() {
        this._addEventListeners()
        this.props.onInit()
        this.props.setAnnotationsManager(this.props.annotationsManager)
    }

    componentWillUnmount() {
        this._removeEventListeners()
    }

    private _addEventListeners() {
        this.ribbonRef.addEventListener('mouseenter', this.handleMouseEnter)
        this.ribbonRef.addEventListener('mouseleave', this.handleMouseLeave)
        document.addEventListener('click', this.handleClick)
        document.addEventListener('keydown', this.handleKeyDown)
    }

    private _removeEventListeners() {
        this.ribbonRef.removeEventListener('mouseenter', this.handleMouseEnter)
        this.ribbonRef.removeEventListener('mouseleave', this.handleMouseLeave)
        document.removeEventListener('click', this.handleClick)
        document.removeEventListener('keydown', this.handleKeyDown)
    }

    private _setRibbonRef = (ref: HTMLElement) => {
        this.ribbonRef = ref
    }

    private _handleTooltipToggle = () => {
        this.props.insertOrRemoveTooltip(this.props.isTooltipEnabled)
        this.props.handleTooltipToggle()
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.props.closeRibbon()
        }
    }

    private handleClick = (e: MouseEvent) => {
        if (!this.mouseInsideRibbon) {
            this.props.closeRibbon()
        }
    }

    private handleMouseEnter = () => {
        this.mouseInsideRibbon = true

        clearTimeout(this.timeoutId)
        this.props.openRibbon()
    }

    private handleMouseLeave = () => {
        this.mouseInsideRibbon = false

        if (this.props.commentText.length === 0) {
            this.timeoutId = setTimeout(
                this.props.closeRibbon,
                this.props.closeTimeoutMs,
            )
        }
    }

    private renderTagsManager() {
        return (
            <IndexDropdown
                env="inpage"
                url={this.props.url}
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
                url={this.props.url}
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
            <div ref={this._setRibbonRef}>
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
    showCollectionsPicker: selectors.showCollectionsPicker(state),
    showCommentBox: selectors.showCommentBox(state),
    showSearchBox: selectors.showSearchBox(state),
    showTagsPicker: selectors.showTagsPicker(state),
    searchValue: selectors.searchValue(state),
    isPaused: pause.isPaused(state),
    isBookmarked: bookmark.isBookmarked(state),
    url: popup.url(state),
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
    closeRibbon: () => dispatch(actions.setIsExpanded(false)),
    setAnnotationsManager: annotationsManager =>
        dispatch(sidebarActs.setAnnotationsManager(annotationsManager)),
    handleRibbonToggle: () => dispatch(actions.toggleRibbon()),
    handleTooltipToggle: () => dispatch(actions.toggleTooltip()),
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
    setShowHighlights: (value: boolean) =>
        dispatch(actions.setShowHighlights(value)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(RibbonContainer)
