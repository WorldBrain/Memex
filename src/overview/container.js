import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'

import { Wrapper, LoadingIndicator } from 'src/common-ui/components'
import * as actions from './actions'
import * as selectors from './selectors'
import ResultList from './components/ResultList'
import Overview from './components/Overview'
import PageResultItem from './components/PageResultItem'
import ResultsMessage from './components/ResultsMessage'
import Tags from 'src/common-ui/components/Tags'
import TagOption from 'src/common-ui/components/TagOption'
import NoResult from 'src/common-ui/components/NoResult'

class OverviewContainer extends Component {
    static propTypes = {
        grabFocusOnMount: PropTypes.bool.isRequired,
        handleInputChange: PropTypes.func.isRequired,
        onBottomReached: PropTypes.func.isRequired,
        isLoading: PropTypes.bool.isRequired,
        isNewSearchLoading: PropTypes.bool.isRequired,
        noResults: PropTypes.bool.isRequired,
        isBadTerm: PropTypes.bool.isRequired,
        showInitSearchMsg: PropTypes.bool.isRequired,
        searchResults: PropTypes.arrayOf(PropTypes.object).isRequired,
        totalResultCount: PropTypes.number.isRequired,
        shouldShowCount: PropTypes.bool.isRequired,
        needsWaypoint: PropTypes.bool.isRequired,
        handleTrashBtnClick: PropTypes.func.isRequired,
        handleToggleBm: PropTypes.func.isRequired,
        pageIdForTag: PropTypes.string.isRequired,
        handleTagBtnClick: PropTypes.func.isRequired,
        newTag: PropTypes.string.isRequired,
        onTagSearchChange: PropTypes.func.isRequired,
        resultTags: PropTypes.arrayOf(PropTypes.object).isRequired,
        addTags: PropTypes.func.isRequired,
        delTags: PropTypes.func.isRequired,
        onTagSearchEnter: PropTypes.func.isRequired,
        suggestedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        emptyTagOptions: PropTypes.bool.isRequired,
    }

    constructor() {
        super()

        this.handleOutsideClick = this.handleOutsideClick.bind(this)
        this.handleKeyBoardUp = this.handleKeyBoardUp.bind(this)
        this.setTagInputFocus = this.setTagInputFocus.bind(this)
    }

    componentWillMount() {
        document.addEventListener('click', this.handleOutsideClick, false)
        document.addEventListener('keyup', this.handleKeyBoardUp, false)
    }

    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.inputQueryEl.focus()
        }
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleOutsideClick, false)
        document.removeEventListener('keyup', this.handleKeyBoardUp, false)
    }

    setInputRef = element => {
        this.inputQueryEl = element
    }

    setTagDivRef = element => {
        this.tagDiv = element
    }

    setTagInputRef = element => {
        this.tagInput = element
    }

    setTagInputFocus(data) {
        console.log(this.tagInput)
        this.tagInput.focus()
        this.props.addTags(data)
    }

    findIndexValue(a, tag) {
        return a.findIndex(i => i.value === tag)
    }

    renderNewTagOption() {
        const { newTag } = this.props
        if (newTag.length !== 0) {
            return (
                <TagOption
                    data={newTag}
                    active={false}
                    newTag={1}
                    addTagsToReverseDoc={this.props.addTags}
                    setTagInputFocus={this.setTagInputFocus}
                />
            )
        }
        return null
    }

    renderOptions(tags, isSuggested) {
        const { resultTags } = this.props

        return tags.map(
            (data, index) =>
                data !== '' && (
                    <TagOption
                        data={isSuggested ? data : data['value']}
                        key={index}
                        active={
                            isSuggested
                                ? this.findIndexValue(resultTags, data) !== -1
                                  ? resultTags[
                                        this.findIndexValue(resultTags, data)
                                    ].isSelected === true
                                  : this.findIndexValue(resultTags, data) !== -1
                                : data['isSelected']
                        }
                        newTag={0}
                        addTagsToReverseDoc={this.props.addTags}
                        handleClick={
                            (isSuggested
                            ? this.findIndexValue(resultTags, data) !== -1
                              ? resultTags[
                                    this.findIndexValue(resultTags, data)
                                ].isSelected === true
                              : this.findIndexValue(resultTags, data) !== -1
                            : data['isSelected'])
                                ? this.props.delTags
                                : this.props.addTags
                        }
                        setTagInputFocus={this.setTagInputFocus}
                    />
                ),
        )
    }

    renderTagsOptions() {
        const {
            resultTags,
            newTag,
            suggestedTags,
            emptyTagOptions,
        } = this.props

        if (emptyTagOptions) {
            return <NoResult />
        }

        if (suggestedTags.length !== 0) {
            return this.renderOptions(suggestedTags, true)
        } else if (newTag.length !== 0) {
            return null
        }

        return this.renderOptions(resultTags, false)
    }

    renderResultItems() {
        const { pageIdForTag, resultTags } = this.props
        const selectedResultTags = resultTags.filter(
            tag => tag.isSelected === true,
        )

        const resultItems = this.props.searchResults.map((doc, i) => (
            <PageResultItem
                key={i}
                onTrashBtnClick={this.props.handleTrashBtnClick(doc.url, i)}
                onToggleBookmarkClick={this.props.handleToggleBm(doc.url, i)}
                showOrNot={doc._id === pageIdForTag}
                onTagBtnClick={this.props.handleTagBtnClick}
                {...doc}
            >
                <div>
                    {doc._id === pageIdForTag && (
                        <Tags
                            onTagSearchChange={this.props.onTagSearchChange}
                            setInputRef={this.setInputRef}
                            onTagSearchEnter={this.props.onTagSearchEnter}
                            numberOfTags={selectedResultTags.length}
                            handleClick={this.props.handleTagBtnClick('')}
                            setTagDivRef={this.setTagDivRef}
                            setTagInputRef={this.setTagInputRef}
                        >
                            <div>
                                {this.renderTagsOptions()}
                                {this.renderNewTagOption()}
                            </div>
                        </Tags>
                    )}
                </div>
            </PageResultItem>
        ))

        // Insert waypoint at the end of results to trigger loading new items when
        // scrolling down
        if (this.props.needsWaypoint) {
            resultItems.push(
                <Waypoint
                    onEnter={this.props.onBottomReached}
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

    renderInitMessage = () => (
        <ResultsMessage>
            You have not made any history yet.
            <br />First, you need to visit some websites or{' '}
            <a
                style={{ color: '#928989' }}
                href="/options/options.html#/import"
            >
                import your existing history & bookmarks
            </a>.<br />
            <br />
            <strong>Tip: </strong>Read the{' '}
            <a
                style={{ color: '#928989' }}
                href="/options/options.html#/tutorial"
            >
                quick tutorial
            </a>.
            <br />
            <br />
            <img src="/img/ship.png" />
        </ResultsMessage>
    )

    renderResults() {
        if (this.props.isBadTerm) {
            return (
                <ResultsMessage>
                    Your search terms are very vague, please try and use more
                    unique language
                </ResultsMessage>
            )
        }

        if (this.props.showInitSearchMsg) {
            return this.renderInitMessage()
        }

        if (this.props.noResults) {
            return (
                <ResultsMessage>
                    No results found for this query. ¯\_(ツ)_/¯{' '}
                </ResultsMessage>
            )
        }

        if (this.props.isNewSearchLoading) {
            return (
                <ResultList>
                    <LoadingIndicator />
                </ResultList>
            )
        }

        // No issues; render out results list view
        return (
            <Wrapper>
                {this.props.shouldShowCount && (
                    <ResultsMessage small>
                        Found <strong>
                            {this.props.totalResultCount}
                        </strong>{' '}
                        results in your digital memory
                    </ResultsMessage>
                )}
                <ResultList>{this.renderResultItems()}</ResultList>
            </Wrapper>
        )
    }

    handleOutsideClick(e) {
        if (this.tagDiv && !this.tagDiv.contains(e.target)) {
            this.props.handleTagBtnClick('')()
        }
    }

    handleKeyBoardUp(e) {
        // console.log("e1: ", e)
    }

    render() {
        return (
            <Overview
                {...this.props}
                setInputRef={this.setInputRef}
                onInputChange={this.props.handleInputChange}
            >
                {this.renderResults()}
            </Overview>
        )
    }
}

const mapStateToProps = state => ({
    isLoading: selectors.isLoading(state),
    isNewSearchLoading: selectors.isNewSearchLoading(state),
    currentQueryParams: selectors.currentQueryParams(state),
    noResults: selectors.noResults(state),
    isBadTerm: selectors.isBadTerm(state),
    searchResults: selectors.results(state),
    isDeleteConfShown: selectors.isDeleteConfShown(state),
    needsWaypoint: selectors.needsPagWaypoint(state),
    showFilter: selectors.showFilter(state),
    showOnlyBookmarks: selectors.showOnlyBookmarks(state),
    showInitSearchMsg: selectors.showInitSearchMsg(state),
    totalResultCount: selectors.totalResultCount(state),
    shouldShowCount: selectors.shouldShowCount(state),
    pageIdForTag: selectors.pageIdForTag(state),
    newTag: selectors.newTag(state),
    resultTags: selectors.resultTags(state),
    deleteTags: selectors.deleteTags(state),
    suggestedTags: selectors.suggestedTags(state),
    emptyTagOptions: selectors.emptyTagOptions(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            onStartDateChange: actions.setStartDate,
            onEndDateChange: actions.setEndDate,
            onBottomReached: actions.getMoreResults,
            hideDeleteConfirm: actions.hideDeleteConfirm,
            deleteDocs: actions.deleteDocs,
            onShowFilterChange: actions.showFilter,
            onShowOnlyBookmarksChange: actions.toggleBookmarkFilter,
        },
        dispatch,
    ),
    handleInputChange: event => {
        const input = event.target
        dispatch(actions.setQuery(input.value))
    },
    handleTrashBtnClick: (url, index) => event => {
        event.preventDefault()
        dispatch(actions.showDeleteConfirm(url, index))
    },
    handleToggleBm: (url, index) => event => {
        event.preventDefault()
        dispatch(actions.toggleBookmark(url, index))
    },
    handleTagBtnClick: pageId => event => {
        if (event) {
            event.preventDefault()
        }

        dispatch(actions.pageIdForTag(pageId))
        dispatch(actions.FetchInitResultTags())
        dispatch(actions.suggestedTags([]))
    },
    onTagSearchChange: event => {
        const tagInput = event.target
        dispatch(actions.produceNewTag(tagInput.value))
        if (tagInput.value === '') {
            dispatch(actions.suggestedTags([]))
        } else {
            dispatch(actions.suggestTagFromOverview(event.target.value))
        }
    },
    addTags: tag => {
        dispatch(actions.addTagsFromOverview(tag))
    },
    delTags: tag => {
        dispatch(actions.delTagsFromOverview(tag))
    },
    onTagSearchEnter: event => {
        if (event.key === 'Enter') {
            event.preventDefault()
            dispatch(actions.addTagsFromOverviewOnEnter(event.target.value))
        }
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(OverviewContainer)
