import React, { PureComponent, MouseEventHandler } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'

import { LoadingIndicator } from '../../../common-ui/components'
import { IndexDropdown } from '../../../common-ui/containers'
import PageResultItem from './PageResultItem'
import ResultList from './ResultList'
import TagPill from './TagPill'
import * as constants from '../constants'
import { RootState } from '../../../options/types'
import { Result } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { actions as listActs } from '../../../custom-lists'
import { acts as deleteConfActs } from '../../delete-confirm-modal'
import { actions as sidebarActs } from '../../../sidebar-overlay/sidebar'
import {
    actions as sidebarLeftActs,
    selectors as sidebarLeft,
} from '../../sidebar-left'
import {
    actions as filterActs,
    selectors as filters,
} from '../../../search-filters'

export interface StateProps {
    isLoading: boolean
    isSidebarOpen: boolean
    needsWaypoint: boolean
    isScrollDisabled: boolean
    isNewSearchLoading: boolean
    isListFilterActive: boolean
    searchResults: Result[]
}

export interface DispatchProps {
    resetUrlDragged: () => void
    hideSearchFilters: () => void
    resetActiveTagIndex: () => void
    setUrlDragged: (url: string) => void
    addTag: (i: number) => (f: string) => void
    delTag: (i: number) => (f: string) => void
    handlePillClick: (tag: string) => MouseEventHandler
    handleTagBtnClick: (i: number) => MouseEventHandler
    handleCommentBtnClick: (doc: Result) => MouseEventHandler
    handleCrossRibbonClick: (doc: Result) => MouseEventHandler
    handleScrollPagination: (args: Waypoint.CallbackArgs) => void
    handleToggleBm: (doc: Result, i: number) => MouseEventHandler
    handleTrashBtnClick: (doc: Result, i: number) => MouseEventHandler
}

export interface OwnProps {}

export type Props = StateProps & DispatchProps & OwnProps

class ResultListContainer extends PureComponent<Props> {
    private dropdownRefs: HTMLSpanElement[] = []
    private tagBtnRefs: HTMLButtonElement[] = []
    private tagDivRef: HTMLDivElement

    private trackDropdownRef = (el: HTMLSpanElement) =>
        this.dropdownRefs.push(el)
    private setTagDivRef = (el: HTMLDivElement) => (this.tagDivRef = el)
    private setTagButtonRef = (el: HTMLButtonElement) =>
        this.tagBtnRefs.push(el)

    componentDidMount() {
        document.addEventListener('click', this.handleOutsideClick, false)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleOutsideClick, false)
    }

    private handleOutsideClick: EventListener = event => {
        // Reduces to `true` if any on input elements were clicked
        const wereAnyClicked = reduce((res, el) => {
            const isEqual = el != null ? el.isEqualNode(event.target) : false
            return res || isEqual
        }, false)

        const clickedTagDiv =
            this.tagDivRef != null &&
            this.tagDivRef.contains(event.target as Node)

        if (
            !clickedTagDiv &&
            !wereAnyClicked(this.tagBtnRefs) &&
            !wereAnyClicked(this.dropdownRefs)
        ) {
            this.props.resetActiveTagIndex()
        }
    }

    private renderTagsManager({ shouldDisplayTagPopup, url, tags }, index) {
        if (!shouldDisplayTagPopup) {
            return null
        }

        return (
            <IndexDropdown
                url={url}
                onFilterAdd={this.props.addTag(index)}
                onFilterDel={this.props.delTag(index)}
                setTagDivRef={this.setTagDivRef}
                initFilters={tags}
                source="tag"
                hover
            />
        )
    }

    private renderTagPills({ tagPillsData, tags }, resultIndex) {
        const pills = tagPillsData.map((tag, i) => (
            <TagPill
                key={i}
                value={tag}
                onClick={this.props.handlePillClick(tag)}
            />
        ))

        // Add on dummy pill with '+' sign if over limit
        if (tags.length > constants.SHOWN_TAGS_LIMIT) {
            return [
                ...pills,
                <TagPill
                    key="+"
                    setRef={this.trackDropdownRef}
                    value={`+${tags.length - constants.SHOWN_TAGS_LIMIT}`}
                    onClick={this.props.handleTagBtnClick(resultIndex)}
                    noBg
                />,
            ]
        }

        return pills
    }

    private renderResultItems() {
        if (this.props.isNewSearchLoading) {
            return <LoadingIndicator />
        }

        const resultItems = this.props.searchResults.map((doc, i) => (
            <PageResultItem
                key={i}
                setTagButtonRef={this.setTagButtonRef}
                tagPills={this.renderTagPills(doc, i)}
                isSidebarOpen={this.props.isSidebarOpen}
                setUrlDragged={this.props.setUrlDragged}
                tagManager={this.renderTagsManager(doc, i)}
                resetUrlDragged={this.props.resetUrlDragged}
                onTagBtnClick={this.props.handleTagBtnClick(i)}
                hideSearchFilters={this.props.hideSearchFilters}
                isListFilterActive={this.props.isListFilterActive}
                onTrashBtnClick={this.props.handleTrashBtnClick(doc, i)}
                onToggleBookmarkClick={this.props.handleToggleBm(doc, i)}
                onCommentBtnClick={this.props.handleCommentBtnClick(doc)}
                handleCrossRibbonClick={this.props.handleCrossRibbonClick(doc)}
                {...doc}
            />
        ))

        // Insert waypoint at the end of results to trigger loading new items when
        // scrolling down
        if (this.props.needsWaypoint) {
            resultItems.push(
                <Waypoint
                    onEnter={this.props.handleScrollPagination}
                    key="waypoint"
                />,
            )
        }

        // Add loading spinner to the list end, if loading
        if (this.props.isLoading) {
            resultItems.push(<LoadingIndicator key="loading" />)
        }

        return resultItems
    }

    render() {
        return (
            <ResultList scrollDisabled={this.props.isScrollDisabled}>
                {this.renderResultItems()}
            </ResultList>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isLoading: selectors.isLoading(state),
    searchResults: selectors.results(state),
    isSidebarOpen: sidebarLeft.isSidebarOpen(state),
    needsWaypoint: selectors.needsPagWaypoint(state),
    isListFilterActive: filters.listFilterActive(state),
    isScrollDisabled: selectors.isScrollDisabled(state),
    isNewSearchLoading: selectors.isNewSearchLoading(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = dispatch => ({
    handleTagBtnClick: index => event => {
        event.preventDefault()
        dispatch(acts.showTags(index))
    },
    handleCommentBtnClick: ({ url, title }) => event => {
        event.preventDefault()
        dispatch(sidebarActs.openSidebar(url, title))
    },
    handleToggleBm: ({ url }, index) => event => {
        event.preventDefault()
        dispatch(acts.toggleBookmark(url, index))
    },
    handleTrashBtnClick: ({ url }, index) => event => {
        event.preventDefault()
        dispatch(deleteConfActs.show(url, index))
    },
    handleScrollPagination: args => dispatch(acts.getMoreResults()),
    handlePillClick: tag => event => {
        event.preventDefault()
        dispatch(filterActs.toggleTagFilter(tag))
    },
    addTag: resultIndex => tag => dispatch(acts.addTag(tag, resultIndex)),
    delTag: resultIndex => tag => dispatch(acts.delTag(tag, resultIndex)),
    resetActiveTagIndex: () => dispatch(acts.resetActiveTagIndex()),
    setUrlDragged: url => dispatch(listActs.setUrlDragged(url)),
    resetUrlDragged: () => dispatch(listActs.resetUrlDragged()),
    hideSearchFilters: () => dispatch(sidebarLeftActs.openSidebarListMode()),
    handleCrossRibbonClick: ({ url }) => event => {
        dispatch(listActs.delPageFromList(url))
        dispatch(acts.hideResultItem(url))
    },
})

export default connect(
    mapState,
    mapDispatch,
)(ResultListContainer)
