import React, { Component, MouseEventHandler } from 'react'
import Waypoint from 'react-waypoint'
import reduce from 'lodash/fp/reduce'
import moment from 'moment'

import { LoadingIndicator } from 'src/common-ui/components'
import ResultItem from './result-item'
import ResultList from './result-list'
import { TagHolder } from 'src/common-ui/components/'
import * as constants from 'src/sidebar-overlay/sidebar/constants'
import {
    ResultWithIndex as Result,
    ResultsByUrl,
    AnnotationMode,
} from '../types'
import { PageUrlsByDay, AnnotsByPageUrl } from 'src/search/background/types'
import { getLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import niceTime from 'src/util/nice-time'
import TagPicker from 'src/tags/ui/TagPicker'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { AnnotationBoxEventProps } from 'src/in-page-ui/components/annotation-box/annotation-box'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'

const styles = require('./result-list.css')

interface StateProps {
    // isLoading: boolean
    needsWaypoint: boolean
    isTermsSearch: boolean
    isNewSearchLoading: boolean
    isListFilterActive: boolean
    areAnnotationsExpanded: boolean
    resultsByUrl: ResultsByUrl
    resultsClusteredByDay: boolean
    annotsByDay: PageUrlsByDay
    isSocialSearch: boolean
    annotationModes: {
        [annotationUrl: string]: AnnotationMode
    }
}

interface DispatchProps {
    resetUrlDragged: () => void
    resetActiveTagIndex: () => void
    setUrlDragged: (url: string) => void
    updateTags: (url: string) => PickerUpdateHandler
    updateLists: (url: string) => PickerUpdateHandler
    fetchInitialTagSuggestions: () => Promise<string[]>
    queryTagSuggestions: (query: string) => Promise<string[]>
    fetchInitialListSuggestions: () => Promise<string[]>
    queryListSuggestions: (query: string) => Promise<string[]>
    handlePillClick: (tag: string) => void
    handleTagBtnClick: (doc: Result) => void
    handleListBtnClick: (doc: Result) => void
    handleCommentBtnClick: (doc: Result, isSocialSearch?: boolean) => void
    handleCrossRibbonClick: (doc: Result, isSocialPost: boolean) => void
    handleScrollPagination: (args: Waypoint.CallbackArgs) => void
    handleToggleBm: (doc: Result) => void
    handleTrashBtnClick: (doc: Result) => void
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

    private renderTagsManager({
        shouldDisplayTagPopup,
        tags: selectedTags,
        url,
    }: Result) {
        if (!shouldDisplayTagPopup) {
            return null
        }

        return (
            <HoverBox>
                <div ref={(ref) => this.setTagDivRef(ref)}>
                    <TagPicker
                        onUpdateEntrySelection={this.props.updateTags(url)}
                        queryEntries={this.props.queryTagSuggestions}
                        loadDefaultSuggestions={
                            this.props.fetchInitialTagSuggestions
                        }
                        initialSelectedEntries={async () => selectedTags}
                    />
                </div>
            </HoverBox>
        )
    }

    private renderListsManager({
        shouldDisplayListPopup,
        lists: selectedLists,
        url,
    }: Result) {
        if (!shouldDisplayListPopup) {
            return null
        }

        return (
            <HoverBox>
                <div ref={(ref) => this.setListDivRef(ref)}>
                    <CollectionPicker
                        onUpdateEntrySelection={this.props.updateLists(url)}
                        queryEntries={this.props.queryListSuggestions}
                        loadDefaultSuggestions={
                            this.props.fetchInitialListSuggestions
                        }
                        initialSelectedEntries={async () => selectedLists}
                    />
                </div>
            </HoverBox>
        )
    }

    private renderTagHolder = (doc: Result) => (
        <TagHolder
            tags={[...new Set([...doc.tags])]}
            maxTagsLimit={constants.SHOWN_TAGS_LIMIT}
            setTagManagerRef={this.trackDropdownRef}
            handlePillClick={(tag) => (event) =>
                this.props.handlePillClick(tag)}
            env={'sidebar'}
            handleTagBtnClick={() => this.props.handleTagBtnClick(doc)}
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

    private attachDocWithPageResultItem(doc, key: number) {
        const isSocialPost = doc.hasOwnProperty('user')

        return (
            <ResultItem
                key={key}
                setTagButtonRef={this.setTagButtonRef}
                tagHolder={this.renderTagHolder(doc)}
                setUrlDragged={this.props.setUrlDragged}
                tagManager={this.renderTagsManager(doc)}
                listManager={this.renderListsManager(doc)}
                resetUrlDragged={this.props.resetUrlDragged}
                onTagBtnClick={() => this.props.handleTagBtnClick(doc)}
                onListBtnClick={() => this.props.handleListBtnClick(doc)}
                isListFilterActive={this.props.isListFilterActive}
                onTrashBtnClick={() => this.props.handleTrashBtnClick(doc)}
                onToggleBookmarkClick={() => this.props.handleToggleBm(doc)}
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
                tagsEventProps={{
                    fetchInitialTagSuggestions: this.props
                        .fetchInitialTagSuggestions,
                    queryTagSuggestions: this.props.queryTagSuggestions,
                }}
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
            return Object.values(this.props.resultsByUrl).map((result) =>
                this.attachDocWithPageResultItem(result, result.index),
            )
        }

        const els: JSX.Element[] = []

        const sortedKeys = Object.keys(this.props.annotsByDay).sort().reverse()

        let resultItemCount = 0
        for (const day of sortedKeys) {
            els.push(
                <p className={styles.clusterTime} key={day}>
                    {this.formatTime(parseInt(day, 10))}
                </p>,
            )

            const pageEls: JSX.Element[] = []

            const currentCluster: AnnotsByPageUrl = this.props.annotsByDay[day]
            for (const [pageUrl, annotations] of Object.entries(
                currentCluster,
            )) {
                const page = this.props.resultsByUrl[pageUrl]

                // Page may be missing from `resultsByUrl` state, but present in `annotsByUrl`, in case of terms search :S
                if (!page) {
                    continue
                }

                pageEls.push(
                    this.attachDocWithPageResultItem(
                        // This is silly we need the presentational components to care about such things;
                        //  we need a better solution for this awkward `annotsByDay` return value from annots search!
                        {
                            ...page,
                            annotations: this.props.isTermsSearch
                                ? page.annotations
                                : annotations,
                        },
                        resultItemCount++,
                    ),
                )
            }

            // We don't want an empty element for the time if there's no matching annots
            if (pageEls.length === 0) {
                els.pop()
            } else {
                els.push(...pageEls)
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
