import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'
import debounce from 'lodash/fp/debounce'

import {
    Wrapper,
    LoadingIndicator,
    Tags,
    NoResult,
    TagOption,
    NewTagMsg,
    OldTagMsg,
} from 'src/common-ui/components'
import * as actions from './actions'
import * as selectors from './selectors'
import ResultList from './components/ResultList'
import Overview from './components/Overview'
import PageResultItem from './components/PageResultItem'
import ResultsMessage from './components/ResultsMessage'
import TagPill from './components/TagPill'

class OverviewContainer extends Component {
    static SHOWN_TAGS_LIMIT = 3

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
        fetchTagSuggestions: PropTypes.func.isRequired,
        resultTags: PropTypes.arrayOf(PropTypes.object).isRequired,
        addTags: PropTypes.func.isRequired,
        delTags: PropTypes.func.isRequired,
        suggestedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        emptyTagOptions: PropTypes.bool.isRequired,
        hoveredTagResult: PropTypes.string.isRequired,
        changeHoveredTag: PropTypes.func.isRequired,
        tagSearchValue: PropTypes.string.isRequired,
        filterTag: PropTypes.func.isRequired,
        updateTagSearchVal: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)

        this.handleOutsideClick = this.handleOutsideClick.bind(this)
        // this.handleKeyBoardDown = this.handleKeyBoardDown.bind(this)
        // this.handleTagEnter = this.handleTagEnter.bind(this)
    }

    componentWillMount() {
        document.addEventListener('click', this.handleOutsideClick, false)
        // document.addEventListener('keypress', this.handleTagEnter, false)
    }

    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.inputQueryEl.focus()
        }
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleOutsideClick, false)
        // document.removeEventListener('keypress', this.handleTagEnter, false)
    }

    setInputRef = el => (this.inputQueryEl = el)
    setTagDivRef = el => (this.tagDiv = el)
    setTagInputRef = el => (this.tagInput = el)
    setTagButtonRef = el => (this.tagButton = el)

    addTag = tag => () => {
        this.props.addTags(tag)
        this.tagInput.focus()
    }

    findIndexValue(a, tag) {
        return a.findIndex(i => i.value === tag)
    }

    handleTagSearchChange = event => {
        const input = event.target
        this.props.updateTagSearchVal(input.value)
        this.props.fetchTagSuggestions()
    }

    handleTagSearchKeyDown = event => {
        if (event.key === 'Enter') {
            event.preventDefault()

            if (this.props.tagSearchValue.trim().length) {
                this.addTag(this.props.tagSearchValue)()
            }
        }
    }

    renderNewTagOption() {
        const { tagSearchValue, hoveredTagResult, suggestedTags } = this.props

        if (
            !!tagSearchValue.length &&
            !suggestedTags.includes(tagSearchValue)
        ) {
            return (
                <TagOption>
                    <NewTagMsg
                        value={tagSearchValue}
                        onClick={this.addTag(tagSearchValue)}
                        hovered={hoveredTagResult === tagSearchValue}
                    />
                </TagOption>
            )
        }
        return null
    }

    returnTagStatus(isSuggested, tag) {
        const { resultTags } = this.props
        const index = this.findIndexValue(
            resultTags,
            isSuggested ? tag : tag['value'],
        )

        return isSuggested
            ? index === -1 ? false : resultTags[index].isSelected
            : resultTags[index].isSelected
    }

    renderTagValue = tag => (typeof tag === 'string' ? tag : tag.value)

    renderOptions(tags, isSuggested) {
        const { hoveredTagResult } = this.props

        return tags.map((tag, i) => {
            const tagValue = this.renderTagValue(tag)
            return (
                <TagOption key={i}>
                    <OldTagMsg
                        value={tagValue}
                        active={this.returnTagStatus(isSuggested, tag)}
                        hovered={hoveredTagResult === tagValue}
                        onClick={
                            this.returnTagStatus(isSuggested, tag)
                                ? this.props.delTags(tagValue)
                                : this.addTag(tagValue)
                        }
                    />
                </TagOption>
            )
        })
    }

    renderTagsOptions() {
        if (this.props.emptyTagOptions) {
            return <NoResult />
        }

        if (this.props.suggestedTags.length !== 0) {
            return this.renderOptions(this.props.suggestedTags, true)
        } else if (this.props.tagSearchValue.length !== 0) {
            return null
        }

        return this.renderOptions(this.props.resultTags, false)
    }

    renderTags(docId) {
        const { pageIdForTag, resultTags, tagSearchValue } = this.props
        const selectedResultTags = resultTags.filter(
            tag => tag.isSelected === true,
        )

        return (
            <div>
                {docId === pageIdForTag && (
                    <Tags
                        onTagSearchChange={this.handleTagSearchChange}
                        onTagSearchKeyDown={this.handleTagSearchKeyDown}
                        setInputRef={this.setTagInputRef}
                        numberOfTags={selectedResultTags.length}
                        setTagDivRef={this.setTagDivRef}
                        tagSearchValue={tagSearchValue}
                        // keydown={this.handleKeyBoardDown}
                        // keypress={this.handleTagEnter}
                        overview
                    >
                        <div>
                            {this.renderTagsOptions()}
                            {this.renderNewTagOption()}
                        </div>
                    </Tags>
                )}
            </div>
        )
    }

    renderTagPills(tags) {
        const pills = tags
            .slice(0, OverviewContainer.SHOWN_TAGS_LIMIT)
            .map(tagKey => tagKey.split('/')[1]) // Grab the part ofter `tag/` key prefix
            .map((tag, i) => (
                <TagPill
                    key={i}
                    value={tag}
                    onClick={this.props.filterTag(tag)}
                />
            ))

        // Add on dummy pill with '+' sign if over limit
        if (tags.length > OverviewContainer.SHOWN_TAGS_LIMIT) {
            return [
                ...pills,
                <TagPill
                    key="+"
                    value={`+${tags.length -
                        OverviewContainer.SHOWN_TAGS_LIMIT}`}
                />,
            ]
        }

        return pills
    }

    renderResultItems() {
        const { pageIdForTag } = this.props

        const resultItems = this.props.searchResults.map((doc, i) => (
            <PageResultItem
                key={i}
                onTrashBtnClick={this.props.handleTrashBtnClick(doc.url, i)}
                onToggleBookmarkClick={this.props.handleToggleBm(doc.url, i)}
                tagItem={this.renderTags(doc._id)}
                setTagButtonRef={this.setTagButtonRef}
                onTagBtnClick={this.props.handleTagBtnClick(
                    pageIdForTag === '' ? doc._id : '',
                    i,
                )}
                tagPills={this.renderTagPills(doc.tags)}
                {...doc}
            />
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
        if (
            this.tagDiv &&
            !this.tagDiv.contains(e.target) &&
            !this.tagButton.isEqualNode(e.target)
        ) {
            this.props.handleTagBtnClick('', -1)(e)
        }
    }

    handleKeyBoardDown(e) {
        const {
            resultTags,
            tagSearchValue,
            suggestedTags,
            emptyTagOptions,
            pageIdForTag,
            hoveredTagResult,
        } = this.props

        if (pageIdForTag !== '') {
            if (emptyTagOptions) {
                this.props.changeHoveredTag(tagSearchValue)
            }

            if (suggestedTags.length !== 0) {
                const index = suggestedTags.indexOf(hoveredTagResult)

                if (e.keyCode === 40) {
                    if (index !== suggestedTags.length - 1) {
                        this.props.changeHoveredTag(suggestedTags[index + 1])
                    } else if (
                        index === suggestedTags.length - 1 &&
                        tagSearchValue !== ''
                    ) {
                        this.props.changeHoveredTag(tagSearchValue)
                    }
                } else if (e.keyCode === 38) {
                    if (index !== 0 && index >= 0) {
                        this.props.changeHoveredTag(suggestedTags[index - 1])
                    } else if (index === -1) {
                        this.props.changeHoveredTag(
                            suggestedTags[suggestedTags.length - 1],
                        )
                    }
                }
            } else if (tagSearchValue.length !== 0) {
                this.props.changeHoveredTag(tagSearchValue)
            } else {
                const index = this.findIndexValue(resultTags, hoveredTagResult)
                if (e.keyCode === 40) {
                    if (index !== resultTags.length - 1) {
                        this.props.changeHoveredTag(resultTags[index + 1].value)
                    }
                } else if (e.keyCode === 38) {
                    if (index !== 0) {
                        this.props.changeHoveredTag(resultTags[index - 1].value)
                    }
                }
            }
        }
    }

    handleTagEnter(e) {
        const { pageIdForTag, hoveredTagResult, resultTags } = this.props

        if (e.keyCode === 13 && pageIdForTag !== '') {
            e.preventDefault()
            const index = this.findIndexValue(resultTags, hoveredTagResult)

            if (index === -1) {
                this.addTag(hoveredTagResult)()
            } else {
                if (resultTags[index].isSelected) {
                    this.props.delTags(hoveredTagResult)()
                } else {
                    this.addTag(hoveredTagResult)()
                }
            }
        }
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
    resultTags: selectors.resultTags(state),
    deleteTags: selectors.deleteTags(state),
    suggestedTags: selectors.suggestedTags(state),
    emptyTagOptions: selectors.emptyTagOptions(state),
    hoveredTagResult: selectors.hoveredTagResult(state),
    tagSearchValue: selectors.tagSearchValue(state),
    tags: selectors.tags(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            onStartDateChange: actions.setStartDate,
            onEndDateChange: actions.setEndDate,
            onBottomReached: actions.getMoreResults,
            resetDeleteConfirm: actions.resetDeleteConfirm,
            deleteDocs: actions.deleteDocs,
            onShowFilterChange: actions.showFilter,
            onShowOnlyBookmarksChange: actions.toggleBookmarkFilter,
            updateTagSearchVal: actions.tagSearchValue,
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
    handleTagBtnClick: (pageId, index) => event => {
        event.preventDefault()
        dispatch(actions.pageIdForTag(pageId))
        dispatch(actions.indexDocFortag(index))
        dispatch(actions.fetchInitResultTags())
        dispatch(actions.suggestedTags([]))
    },
    fetchTagSuggestions: debounce(300)(() =>
        dispatch(actions.fetchTagSuggestions()),
    ),
    addTags: tag => dispatch(actions.addTagsFromOverview(tag)),
    delTags: tag => () => dispatch(actions.delTagsFromOverview(tag)),
    changeHoveredTag: tag => {
        dispatch(actions.hoveredTagResult(tag))
    },
    filterTag: tag => event => {
        event.preventDefault()
        dispatch(actions.searchByTags(tag))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(OverviewContainer)
