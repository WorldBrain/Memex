import React, { Component, MouseEventHandler } from 'react'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'
import moment from 'moment'

import { LoadingIndicator } from 'src/common-ui/components'
import ResultItem from './result-item'
import { IndexDropdown } from 'src/common-ui/containers'
import ResultList from './result-list'
import { TagHolder } from 'src/common-ui/components/'
import * as constants from 'src/sidebar-overlay/sidebar/constants'
import { Result, ResultsByUrl } from 'src/overview/types'
import { PageUrlsByDay, AnnotsByPageUrl } from 'src/search/background/types'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import niceTime from 'src/util/nice-time'
import TagPicker from 'src/tags/ui/TagPicker'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import { tags, collections } from 'src/util/remote-functions-background'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { AnnotationBoxEventProps } from 'src/in-page-ui/components/annotation-box/annotation-box'
import { AnnotationMode } from '../types'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'

const styles = require('./result-list.css')

interface StateProps {
    // isLoading: boolean
    needsWaypoint: boolean
    isNewSearchLoading: boolean
    isListFilterActive: boolean
    areAnnotationsExpanded: boolean
    searchResults: Result[]
    resultsByUrl: ResultsByUrl
    resultsClusteredByDay: boolean
    annotsByDay: PageUrlsByDay
    isSocialSearch: boolean
    tagSuggestions: string[]
    annotationModes: {
        [annotationUrl: string]: AnnotationMode
    }
}

interface DispatchProps {
    resetUrlDragged: () => void
    resetActiveTagIndex: () => void
    setUrlDragged: (url: string) => void
    addList: (i: number) => (f: string) => void
    delList: (i: number) => (f: string) => void
    addTag: (i: number) => (f: string) => void
    delTag: (i: number) => (f: string) => void
    handlePillClick: (tag: string) => void
    handleTagBtnClick: (doc: Result, i: number) => void
    handleListBtnClick: (doc: Result, i: number) => void
    handleCommentBtnClick: (doc: Result, isSocialSearch?: boolean) => void
    handleCrossRibbonClick: (doc: Result, isSocialPost: boolean) => void
    handleScrollPagination: (args: Waypoint.CallbackArgs) => void
    handleToggleBm: (doc: Result, i: number) => void
    handleTrashBtnClick: (doc: Result, i: number) => void
}

interface OwnProps {
    highlighter: Pick<
        HighlightInteractionInterface,
        'removeTempHighlights' | 'removeAnnotationHighlights'
    >
    annotationEventHandlers: AnnotationBoxEventProps
}

export type ResultListContainerProps = StateProps & DispatchProps & OwnProps

export default class ResultListContainer extends Component<
    ResultListContainerProps
> {
    private dropdownRefs: HTMLSpanElement[] = []
    private tagBtnRefs: HTMLButtonElement[] = []
    private tagDivRef: HTMLDivElement
    private resultsDivRef: HTMLDivElement
    private listDivRef: HTMLDivElement

    private setResultsDivRef = (el: HTMLDivElement) => (this.resultsDivRef = el)
    private trackDropdownRef = (el: HTMLSpanElement) =>
        this.dropdownRefs.push(el)
    private setTagDivRef = (el: HTMLDivElement) => (this.tagDivRef = el)
    private setListDivRef = (el: HTMLDivElement) => (this.listDivRef = el)
    private setTagButtonRef = (el: HTMLButtonElement) =>
        this.tagBtnRefs.push(el)

    async componentDidMount() {
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])
        this.setState({ tagSuggestions: tagSuggestions.reverse() })

        this.resultsDivRef.addEventListener('click', this.handleOutsideClick)
    }

    componentWillUnmount() {
        this.resultsDivRef.removeEventListener('click', this.handleOutsideClick)
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
    }

    private handleTagUpdate = (index: number) => async (
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

    private handleListUpdate = (index: number) => async (
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

    private renderTagsManager(
        { shouldDisplayTagPopup, tags: selectedTags },
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
                        initialSelectedEntries={() => selectedTags}
                    />
                </div>
            </HoverBox>
        )
    }

    private renderListsManager(
        { shouldDisplayListPopup, lists: selectedLists }: Result,
        index: number,
    ) {
        if (!shouldDisplayListPopup) {
            return null
        }

        return (
            <HoverBox>
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

    private renderTagHolder = (doc, resultIndex) => (
        <TagHolder
            tags={[...new Set([...doc.tags])]}
            maxTagsLimit={constants.SHOWN_TAGS_LIMIT}
            setTagManagerRef={this.trackDropdownRef}
            handlePillClick={(tag) => (event) =>
                this.props.handlePillClick(tag)}
            env={'sidebar'}
            handleTagBtnClick={() =>
                this.props.handleTagBtnClick(doc, resultIndex)
            }
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
                listManager={this.renderListsManager(doc, index)}
                resetUrlDragged={this.props.resetUrlDragged}
                onTagBtnClick={() => this.props.handleTagBtnClick(doc, index)}
                onListBtnClick={() => this.props.handleListBtnClick(doc, index)}
                isListFilterActive={this.props.isListFilterActive}
                onTrashBtnClick={() =>
                    this.props.handleTrashBtnClick(doc, index)
                }
                onToggleBookmarkClick={() =>
                    this.props.handleToggleBm(doc, index)
                }
                onCommentBtnClick={() =>
                    this.props.handleCommentBtnClick(doc, isSocialPost)
                }
                handleCrossRibbonClick={() =>
                    this.props.handleCrossRibbonClick(doc, isSocialPost)
                }
                areAnnotationsExpanded={this.props.areAnnotationsExpanded}
                isSocial={isSocialPost}
                highlighter={this.props.highlighter}
                annotationModes={this.props.annotationModes}
                annotationEventProps={this.props.annotationEventHandlers}
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

        const sortedKeys = Object.keys(this.props.annotsByDay).sort().reverse()

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

        // // Add loading spinner to the list end, if loading
        // if (this.props.isLoading) {
        //     resultItems.push(<LoadingIndicator key="loading" />)
        // }

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
