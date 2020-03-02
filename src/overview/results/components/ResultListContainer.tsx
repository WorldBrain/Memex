import React, { PureComponent, MouseEventHandler } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'
import moment from 'moment'

import { selectors as opt } from 'src/options/settings'
import { LoadingIndicator, ResultItem } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import ResultList from './ResultList'
import { TagHolder } from 'src/common-ui/components/'
import * as constants from '../constants'
import { RootState } from 'src/options/types'
import { Result, ResultsByUrl } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'
import { actions as listActs } from 'src/custom-lists'
import { acts as deleteConfActs } from '../../delete-confirm-modal'
import { actions as sidebarActs } from 'src/sidebar-overlay/sidebar'
import { selectors as sidebarLeft } from '../../sidebar-left'
import { actions as filterActs, selectors as filters } from 'src/search-filters'
import { PageUrlsByDay, AnnotsByPageUrl } from 'src/search/background/types'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import niceTime from 'src/util/nice-time'
import { Annotation } from 'src/annotations/types'

const styles = require('./ResultList.css')

export interface StateProps {
    isLoading: boolean
    isSidebarOpen: boolean
    needsWaypoint: boolean
    isScrollDisabled: boolean
    isNewSearchLoading: boolean
    isListFilterActive: boolean
    resultsClusteredByDay: boolean
    areAnnotationsExpanded: boolean
    areScreenshotsEnabled: boolean
    activeSidebarIndex: number
    searchResults: Result[]
    resultsByUrl: ResultsByUrl
    annotsByDay: PageUrlsByDay
    isFilterBarActive: boolean
    isSocialPost: boolean
}

export interface DispatchProps {
    resetUrlDragged: () => void
    resetActiveTagIndex: () => void
    setUrlDragged: (url: string) => void
    addTag: (i: number) => (f: string) => void
    delTag: (i: number) => (f: string) => void
    handlePillClick: (tag: string) => MouseEventHandler
    handleTagBtnClick: (i: number) => MouseEventHandler
    handleCommentBtnClick: (
        doc: Result,
        index: number,
        isSocialPost?: boolean,
    ) => MouseEventHandler
    handleCrossRibbonClick: (
        doc: Result,
        isSocialPost: boolean,
    ) => MouseEventHandler
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

    state = {
        tagSuggestions: [],
    }

    async componentDidMount() {
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])
        this.setState({ tagSuggestions: tagSuggestions.reverse() })

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
                isSocialPost={this.props.isSocialPost}
                initFilters={tags}
                initSuggestions={[
                    ...new Set([...tags, ...this.state.tagSuggestions]),
                ]}
                source="tag"
                isForRibbon
                hover
                fromOverview
            />
        )
    }

    private renderTagHolder = ({ tags }, resultIndex) => (
        <TagHolder
            tags={[...new Set([...tags])]}
            maxTagsLimit={constants.SHOWN_TAGS_LIMIT}
            setTagManagerRef={this.trackDropdownRef}
            handlePillClick={this.props.handlePillClick}
            handleTagBtnClick={this.props.handleTagBtnClick(resultIndex)}
            env={'overview'}
        />
    )

    private formatTime(date: number): string {
        return moment(date).calendar(null, {
            sameDay: '[Today]',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'dddd, DD MMMM, YYYY',
        })
    }

    private attachDocWithPageResultItem(doc: Result, index, key) {
        const isSocialPost = doc.hasOwnProperty('user')

        return (
            <ResultItem
                key={key}
                isOverview
                tags={doc.tags}
                setTagButtonRef={this.setTagButtonRef}
                tagHolder={this.renderTagHolder(doc, index)}
                setUrlDragged={this.props.setUrlDragged}
                tagManager={this.renderTagsManager(doc, index)}
                resetUrlDragged={this.props.resetUrlDragged}
                onTagBtnClick={this.props.handleTagBtnClick(index)}
                isListFilterActive={this.props.isListFilterActive}
                onTrashBtnClick={this.props.handleTrashBtnClick(doc, index)}
                onToggleBookmarkClick={this.props.handleToggleBm(doc, index)}
                onCommentBtnClick={this.props.handleCommentBtnClick(
                    doc,
                    index,
                    isSocialPost,
                )}
                handleCrossRibbonClick={this.props.handleCrossRibbonClick(
                    doc,
                    isSocialPost,
                )}
                areAnnotationsExpanded={this.props.areAnnotationsExpanded}
                areScreenshotsEnabled={this.props.areScreenshotsEnabled}
                isResponsibleForSidebar={
                    this.props.activeSidebarIndex === index
                }
                isSocial={isSocialPost}
                {...doc}
                displayTime={niceTime(doc.displayTime)}
            />
        )
    }

    /*
     * Switch rendering method based on annotsSearch value.
     * If it's a page search, a simple map to PageResult items is enough.
     * For Annotation search, docs and annotsByDay are merged to render a
     * clustered view
     */
    private resultsStateToItems() {
        if (!this.props.resultsClusteredByDay) {
            return this.props.searchResults.map((res, i) =>
                this.attachDocWithPageResultItem(res, i, i),
            )
        }

        if (!this.props.annotsByDay) {
            return []
        }

        const els: JSX.Element[] = []

        const sortedKeys = Object.keys(this.props.annotsByDay)
            .sort()
            .reverse()

        for (const day of sortedKeys) {
            els.push(
                <p className={styles.clusterTime} key={day}>
                    {this.formatTime(parseInt(day, 10))}
                </p>,
            )

            const currentCluster: { [key: string]: Annotation[] } = this.props
                .annotsByDay[day]
            for (const [pageUrl, annotations] of Object.entries(
                currentCluster,
            )) {
                const page = this.props.resultsByUrl.get(pageUrl)

                if (!page) {
                    continue // Page not found for whatever reason...
                }

                els.push(
                    this.attachDocWithPageResultItem(
                        { ...page, annotations } as any,
                        page.index,
                        `${day}${pageUrl}`,
                    ),
                )
            }
        }

        return els
    }

    private renderResultItems() {
        if (this.props.isNewSearchLoading) {
            return <LoadingIndicator />
        }

        const resultItems = this.resultsStateToItems()

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
            <ResultList
                scrollDisabled={this.props.isScrollDisabled}
                isFilterBarActive={this.props.isFilterBarActive}
            >
                {this.renderResultItems()}
            </ResultList>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isLoading: selectors.isLoading(state),
    searchResults: selectors.results(state),
    resultsByUrl: selectors.resultsByUrl(state),
    annotsByDay: selectors.annotsByDay(state),
    isSidebarOpen: sidebarLeft.isSidebarOpen(state),
    areScreenshotsEnabled: opt.screenshots(state),
    needsWaypoint: selectors.needsPagWaypoint(state),
    isListFilterActive: filters.listFilterActive(state),
    isScrollDisabled: selectors.isScrollDisabled(state),
    activeSidebarIndex: selectors.activeSidebarIndex(state),
    isNewSearchLoading: selectors.isNewSearchLoading(state),
    resultsClusteredByDay: selectors.resultsClusteredByDay(state),
    areAnnotationsExpanded: selectors.areAnnotationsExpanded(state),
    isFilterBarActive: filters.showFilterBar(state),
    isSocialPost: selectors.isSocialPost(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = dispatch => ({
    handleTagBtnClick: index => event => {
        event.preventDefault()
        dispatch(acts.showTags(index))
    },
    handleCommentBtnClick: ({ url, title }, index, isSocialPost) => event => {
        event.preventDefault()
        dispatch(acts.setActiveSidebarIndex(index))
        dispatch(
            sidebarActs.openSidebar({
                url,
                title,
                forceFetch: true,
                isSocialPost,
            }),
        )
    },
    handleToggleBm: ({ url, fullUrl }, index) => event => {
        event.preventDefault()
        dispatch(acts.toggleBookmark({ url, fullUrl, index }))
    },
    handleTrashBtnClick: ({ url }, index) => event => {
        event.preventDefault()
        dispatch(deleteConfActs.show(url, index))
    },
    handleScrollPagination: args => dispatch(acts.getMoreResults()),
    handlePillClick: tag => event => {
        event.preventDefault()
        event.stopPropagation()
        dispatch(filterActs.toggleTagFilter(tag))
    },
    addTag: resultIndex => tag => dispatch(acts.addTag(tag, resultIndex)),
    delTag: resultIndex => tag => dispatch(acts.delTag(tag, resultIndex)),
    resetActiveTagIndex: () => dispatch(acts.resetActiveTagIndex()),
    setUrlDragged: url => dispatch(listActs.setUrlDragged(url)),
    resetUrlDragged: () => dispatch(listActs.resetUrlDragged()),
    handleCrossRibbonClick: ({ url }, isSocialPost) => event => {
        event.preventDefault()
        event.stopPropagation()
        dispatch(listActs.delPageFromList(url, isSocialPost))
        dispatch(acts.hideResultItem(url))
    },
})

export default connect(mapState, mapDispatch)(ResultListContainer)
