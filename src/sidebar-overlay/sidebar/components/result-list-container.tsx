import React, { PureComponent, MouseEventHandler } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'
import moment from 'moment'

import { LoadingIndicator, ResultItem } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import ResultList from './result-list'
import { TagHolder } from 'src/common-ui/components/'
import * as constants from 'src/sidebar-overlay/sidebar/constants'
import RootState from 'src/sidebar-overlay/types'
import { Result, ResultsByUrl, ResultWithIndex } from 'src/overview/types'
import { selectors as results, acts as resultActs } from 'src/overview/results'
import { actions as listActs } from 'src/custom-lists'
import { acts as deleteConfActs } from 'src/overview/delete-confirm-modal'
import { actions as sidebarActs } from 'src/sidebar-overlay/sidebar'
import { actions as filterActs, selectors as filters } from 'src/search-filters'
import { PageUrlsByDay, AnnotsByPageUrl } from 'src/search/background/types'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import niceTime from 'src/util/nice-time'

const styles = require('./result-list.css')

export interface StateProps {
    isLoading: boolean
    needsWaypoint: boolean
    isNewSearchLoading: boolean
    isListFilterActive: boolean
    areAnnotationsExpanded: boolean
    searchResults: Result[]
    resultsByUrl: ResultsByUrl
    resultsClusteredByDay: boolean
    annotsByDay: PageUrlsByDay
    isSocialSearch: boolean
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
        isSocialSearch?: boolean,
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

interface State {
    tagSuggestions: string[]
}

class ResultListContainer extends PureComponent<Props, State> {
    private dropdownRefs: HTMLSpanElement[] = []
    private tagBtnRefs: HTMLButtonElement[] = []
    private tagDivRef: HTMLDivElement
    private resultsDivRef: HTMLDivElement

    private setResultsDivRef = (el: HTMLDivElement) => (this.resultsDivRef = el)
    private trackDropdownRef = (el: HTMLSpanElement) =>
        this.dropdownRefs.push(el)
    private setTagDivRef = (el: HTMLDivElement) => (this.tagDivRef = el)
    private setTagButtonRef = (el: HTMLButtonElement) =>
        this.tagBtnRefs.push(el)

    state: State = {
        tagSuggestions: [],
    }

    async componentDidMount() {
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])
        this.setState({ tagSuggestions: tagSuggestions.reverse() })

        this.resultsDivRef.addEventListener('click', this.handleOutsideClick)
    }

    componentWillUnmount() {
        this.resultsDivRef.removeEventListener('click', this.handleOutsideClick)
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
                env="inpage"
                url={url}
                onFilterAdd={this.props.addTag(index)}
                onFilterDel={this.props.delTag(index)}
                setTagDivRef={this.setTagDivRef}
                initFilters={tags}
                initSuggestions={[
                    ...new Set([...tags, ...this.state.tagSuggestions]),
                ]}
                source="tag"
                isForRibbon
                sidebarTagDiv
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
            env={'sidebar'}
            handleTagBtnClick={this.props.handleTagBtnClick(resultIndex)}
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

    private attachDocWithPageResultItem(doc, index, key) {
        const isSocialPost = doc.hasOwnProperty('user')

        return (
            <ResultItem
                key={key}
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
                    isSocialPost,
                )}
                handleCrossRibbonClick={this.props.handleCrossRibbonClick(
                    doc,
                    isSocialPost,
                )}
                areAnnotationsExpanded={this.props.areAnnotationsExpanded}
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

            const currentCluster: AnnotsByPageUrl = this.props.annotsByDay[day]
            for (const [pageUrl, annotations] of Object.entries(
                currentCluster,
            )) {
                const page = this.props.resultsByUrl.get(pageUrl)

                if (!page) {
                    continue // Page not found for whatever reason...
                }

                els.push(
                    this.attachDocWithPageResultItem(
                        { ...page, annotations },
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
            <div ref={this.setResultsDivRef}>
                <ResultList>{this.renderResultItems()}</ResultList>
            </div>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isLoading: results.isLoading(state),
    searchResults: results.results(state),
    resultsByUrl: results.resultsByUrl(state),
    annotsByDay: results.annotsByDay(state),
    needsWaypoint: results.needsPagWaypoint(state),
    isListFilterActive: filters.listFilterActive(state),
    isNewSearchLoading: results.isNewSearchLoading(state),
    resultsClusteredByDay: results.resultsClusteredByDay(state),
    areAnnotationsExpanded: results.areAnnotationsExpanded(state),
    isSocialSearch: results.isSocialPost(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = dispatch => ({
    handleTagBtnClick: index => event => {
        event.preventDefault()
        dispatch(resultActs.showTags(index))
    },
    handleCommentBtnClick: ({ url, title }, isSocialPost) => event => {
        event.preventDefault()
        dispatch(sidebarActs.setPageType('page'))
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
        dispatch(resultActs.toggleBookmark({ url, fullUrl, index }))
    },
    handleTrashBtnClick: ({ url }, index) => event => {
        event.preventDefault()
        dispatch(deleteConfActs.show(url, index))
    },
    handleScrollPagination: args => dispatch(resultActs.getMoreResults(false)),
    handlePillClick: tag => event => {
        event.preventDefault()
        event.stopPropagation()
        dispatch(filterActs.toggleTagFilter(tag))
    },
    addTag: resultIndex => tag => dispatch(resultActs.addTag(tag, resultIndex)),
    delTag: resultIndex => tag => dispatch(resultActs.delTag(tag, resultIndex)),
    resetActiveTagIndex: () => dispatch(resultActs.resetActiveTagIndex()),
    setUrlDragged: url => dispatch(listActs.setUrlDragged(url)),
    resetUrlDragged: () => dispatch(listActs.resetUrlDragged()),
    handleCrossRibbonClick: ({ url }, isSocialPost) => event => {
        event.preventDefault()
        event.stopPropagation()
        dispatch(listActs.delPageFromList(url, isSocialPost))
        dispatch(resultActs.hideResultItem(url))
    },
})

export default connect(mapState, mapDispatch)(ResultListContainer)
