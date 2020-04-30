import React, { PureComponent, MouseEventHandler } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'
import moment from 'moment'
import { selectors as opt } from 'src/options/settings'
import { LoadingIndicator, ResultItem, Tooltip } from 'src/common-ui/components'
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
import { PageUrlsByDay } from 'src/search/background/types'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import niceTime from 'src/util/nice-time'
import { Annotation } from 'src/annotations/types'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import TagPicker from 'src/tags/ui/TagPicker'
import { tags, collections } from 'src/util/remote-functions-background'
import { HoverBoxDashboard as HoverBox } from 'src/common-ui/components/design-library/HoverBox'

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
    resetActiveListIndex: () => void
    setUrlDragged: (url: string) => void
    addList: (i: number) => (f: string) => void
    delList: (i: number) => (f: string) => void
    addTag: (i: number) => (f: string) => void
    delTag: (i: number) => (f: string) => void
    handlePillClick: (tag: string) => MouseEventHandler
    handleTagBtnClick: (i: number) => MouseEventHandler
    handleListBtnClick: (i: number) => MouseEventHandler
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
    private listBtnRefs: HTMLButtonElement[] = []
    private tagDivRef: HTMLDivElement
    private listDivRef: HTMLDivElement

    private trackDropdownRef = (el: HTMLSpanElement) =>
        this.dropdownRefs.push(el)
    private setTagDivRef = (el: HTMLDivElement) => (this.tagDivRef = el)
    private setListDivRef = (el: HTMLDivElement) => (this.listDivRef = el)
    private setTagButtonRef = (el: HTMLButtonElement) =>
        this.tagBtnRefs.push(el)
    private setListButtonRef = (el: HTMLButtonElement) =>
        this.listBtnRefs.push(el)

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

    private handleOutsideClick: EventListener = (event) => {
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

        const clickedListDiv =
            this.listDivRef != null &&
            this.listDivRef.contains(event.target as Node)

        if (!clickedListDiv && !wereAnyClicked(this.listBtnRefs)) {
            this.props.resetActiveListIndex()
        }
    }

    handleTagUpdate = (index: number) => async (
        _: string[],
        added: string,
        deleted: string,
    ) => {
        const url = this.props.searchResults[index].url
        const backendResult = tags.updateTagForPage({
            added,
            deleted,
            url,
        })

        if (added) {
            this.props.addTag(index)(added)
        }
        if (deleted) {
            return this.props.delTag(index)(deleted)
        }
        return backendResult
    }

    handleListUpdate = (index: number) => async (
        _: string[],
        added: string,
        deleted: string,
    ) => {
        const url = this.props.searchResults[index].url
        const backendResult = collections.updateListForPage({
            added,
            deleted,
            url,
        })
        if (added) {
            this.props.addList(index)(added)
        }
        if (deleted) {
            return this.props.delList(index)(deleted)
        }
        return backendResult
    }

    private renderListsManager(
        { shouldDisplayListPopup, lists: selectedLists }: Result,
        index: number,
    ) {
        if (!shouldDisplayListPopup) {
            return null
        }

        return (
            <HoverBox marginLeftOffset={50}>
                <div ref={(ref) => this.setListDivRef(ref)}>
                    <CollectionPicker
                        onUpdateEntrySelection={this.handleListUpdate(index)}
                        queryEntries={(query) =>
                            collections.searchForListSuggestions({ query })
                        }
                        loadDefaultSuggestions={
                            collections.fetchInitialListSuggestions
                        }
                        initialSelectedEntries={async () => selectedLists}
                    />
                </div>
            </HoverBox>
        )
    }

    private renderTagsManager(
        { shouldDisplayTagPopup, tags: selectedTags }: Result,
        index,
    ) {
        if (!shouldDisplayTagPopup) {
            return null
        }

        return (
            <HoverBox>
                <div ref={(ref) => this.setTagDivRef(ref)}>
                    <TagPicker
                        onUpdateEntrySelection={this.handleTagUpdate(index)}
                        queryEntries={(query) =>
                            tags.searchForTagSuggestions({ query })
                        }
                        loadDefaultSuggestions={tags.fetchInitialTagSuggestions}
                        initialSelectedEntries={async () => selectedTags}
                    />
                </div>
            </HoverBox>
        )
    }

    private renderTagHolder = ({ tags: currentTags }, resultIndex) => (
        <TagHolder
            tags={[...new Set([...currentTags])]}
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
                lists={doc.lists}
                setTagButtonRef={this.setTagButtonRef}
                setListButtonRef={this.setListButtonRef}
                tagHolder={this.renderTagHolder(doc, index)}
                setUrlDragged={this.props.setUrlDragged}
                tagManager={this.renderTagsManager(doc, index)}
                listManager={this.renderListsManager(doc, index)}
                resetUrlDragged={this.props.resetUrlDragged}
                onTagBtnClick={this.props.handleTagBtnClick(index)}
                onListBtnClick={this.props.handleListBtnClick(index)}
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

        const sortedKeys = Object.keys(this.props.annotsByDay).sort().reverse()

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
            resultItems.push(
                <div className={styles.LoadingIndicatorContainer}>
                    <LoadingIndicator key="loading" />
                </div>,
            )
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

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
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

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
) => ({
    handleTagBtnClick: (index) => (event) => {
        event.preventDefault()
        dispatch(acts.toggleShowTagsPicker(index))
    },
    handleListBtnClick: (index) => (event) => {
        event.preventDefault()
        dispatch(acts.toggleShowListsPicker(index))
    },
    handleCommentBtnClick: ({ url, title }, index, isSocialPost) => (event) => {
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
    handleToggleBm: ({ url, fullUrl }, index) => (event) => {
        event.preventDefault()
        dispatch(acts.toggleBookmark({ url, fullUrl, index }))
    },
    handleTrashBtnClick: ({ url }, index) => (event) => {
        event.preventDefault()
        dispatch(deleteConfActs.show(url, index))
    },
    handleScrollPagination: (args) => dispatch(acts.getMoreResults()),
    handlePillClick: (tag) => (event) => {
        event.preventDefault()
        event.stopPropagation()
        dispatch(filterActs.toggleTagFilter(tag))
    },
    addList: (resultIndex) => (list) =>
        dispatch(acts.addList(list, resultIndex)),
    delList: (resultIndex) => (list) =>
        dispatch(acts.delList(list, resultIndex)),
    addTag: (resultIndex) => (tag) => dispatch(acts.addTag(tag, resultIndex)),
    delTag: (resultIndex) => (tag) => dispatch(acts.delTag(tag, resultIndex)),
    resetActiveTagIndex: () => dispatch(acts.resetActiveTagIndex()),
    resetActiveListIndex: () => dispatch(acts.resetActiveListIndex()),
    setUrlDragged: (url) => dispatch(listActs.setUrlDragged(url)),
    resetUrlDragged: () => dispatch(listActs.resetUrlDragged()),
    handleCrossRibbonClick: ({ url }, isSocialPost) => (event) => {
        event.preventDefault()
        event.stopPropagation()
        dispatch(listActs.delPageFromList(url, isSocialPost))
        dispatch(acts.hideResultItem(url))
    },
})

export default connect(mapState, mapDispatch)(ResultListContainer)
