import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Checkbox } from 'src/common-ui/components'
import {
    SearchFilters,
    BookmarkFilter,
    FilterBar,
    FilteredRow,
    IndexDropdownSB,
    ContentTypeContainer,
} from './components'
import { actions, selectors } from './'
import { selectors as sidebar } from '../overview/sidebar-left'

class SearchFiltersContainer extends PureComponent {
    static propTypes = {
        filteredTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        filteredDomains: PropTypes.arrayOf(PropTypes.object).isRequired,
        addTagFilter: PropTypes.func.isRequired,
        delTagFilter: PropTypes.func.isRequired,
        addDomainFilter: PropTypes.func.isRequired,
        showDomainFilter: PropTypes.func.isRequired,
        showTagFilter: PropTypes.func.isRequired,
        tagFilterDropdown: PropTypes.bool.isRequired,
        domainFilterDropdown: PropTypes.bool.isRequired,
        bookmarkFilter: PropTypes.bool.isRequired,
        onShowOnlyBookmarksChange: PropTypes.func.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        hideTagFilter: PropTypes.func.isRequired,
        hideDomainFilter: PropTypes.func.isRequired,
        delIncDomainFilter: PropTypes.func.isRequired,
        delExcDomainFilter: PropTypes.func.isRequired,
        fetchSuggestedTags: PropTypes.func.isRequired,
        suggestedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        fetchSuggestedDomains: PropTypes.func.isRequired,
        suggestedDomains: PropTypes.arrayOf(PropTypes.object).isRequired,
        toggleFilterTypes: PropTypes.func.isRequired,
        showfilteredTypes: PropTypes.bool.isRequired,
    }

    componentDidMount() {
        /** fetch initial suggested tags and domains to prepopulate
         filter dropdown **/
        this.props.fetchSuggestedTags()
        this.props.fetchSuggestedDomains()
    }

    renderBookmarkFilter = () => <BookmarkFilter />

    renderFilteredTags = () => {
        return !this.props.tagFilterDropdown
            ? this.props.filteredTags.map((tag, i) => (
                  <FilteredRow
                      key={i}
                      value={tag}
                      onClick={() => this.props.delTagFilter(tag)}
                      active
                  />
              ))
            : null
    }

    renderContentFilter = () => (
        <ContentTypeContainer
            showFilteredTypes={this.props.showfilteredTypes}
            toggleFilterTypes={this.props.toggleFilterTypes}
        />
    )

    renderFilteredDomains = () => {
        return !this.props.domainFilterDropdown
            ? this.props.filteredDomains.map(({ value, isExclusive }, i) => (
                  <FilteredRow
                      key={i}
                      value={value}
                      onClick={this.toggleDomainFilter({ value, isExclusive })}
                      active
                      isExclusive={isExclusive}
                  />
              ))
            : null
    }

    toggleDomainFilter = ({ value, isExclusive }) => () => {
        !isExclusive
            ? this.props.delIncDomainFilter(value)
            : this.props.delExcDomainFilter(value)
    }

    renderTagFilter = () =>
        !this.props.tagFilterDropdown ? (
            <FilterBar onBarClick={this.props.showTagFilter} filter="Tag" />
        ) : (
            <IndexDropdownSB
                onFilterAdd={this.props.addTagFilter}
                onFilterDel={this.props.delTagFilter}
                initFilters={this.props.filteredTags}
                initSuggestions={this.props.suggestedTags}
                source="tag"
                isSidebarOpen={this.props.isSidebarOpen}
                closeDropdown={this.props.hideTagFilter}
            />
        )

    renderDomainFilter = () =>
        !this.props.domainFilterDropdown ? (
            <FilterBar
                onBarClick={this.props.showDomainFilter}
                filter="Domain"
            />
        ) : (
            <IndexDropdownSB
                onFilterAdd={this.props.addDomainFilter}
                onFilterDel={this.props.delIncDomainFilter}
                initFilters={this.props.filteredDomains.map(
                    ({ value }) => value,
                )}
                initSuggestions={this.props.suggestedDomains.map(
                    ({ value }) => value,
                )}
                source="domain"
                isSidebarOpen={this.props.isSidebarOpen}
                closeDropdown={this.props.hideDomainFilter}
            />
        )

    renderBookmarkFilter = () => (
        <Checkbox
            id="toggle-bookmark"
            isChecked={this.props.bookmarkFilter}
            handleChange={this.props.onShowOnlyBookmarksChange}
        >
            Bookmarks only
        </Checkbox>
    )

    render() {
        return (
            <SearchFilters
                bookmarkFilter={this.renderBookmarkFilter()}
                tagFilter={this.renderTagFilter()}
                domainFilter={this.renderDomainFilter()}
                contentFilter={this.renderContentFilter()}
                filteredTags={this.renderFilteredTags()}
                filteredDomains={this.renderFilteredDomains()}
            />
        )
    }
}

const mapStateToProps = state => ({
    filteredTags: selectors.tags(state),
    filteredDomains: selectors.displayDomains(state),
    domainFilterDropdown: selectors.domainFilter(state),
    tagFilterDropdown: selectors.tagFilter(state),
    bookmarkFilter: selectors.onlyBookmarks(state),
    isSidebarOpen: sidebar.isSidebarOpen(state),
    showfilteredTypes: selectors.filterTypes(state),
    suggestedTags: selectors.suggestedTags(state),
    suggestedDomains: selectors.suggestedDomains(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            hideDomainFilter: actions.hideDomainFilter,
            showDomainFilter: actions.showDomainFilter,
            hideTagFilter: actions.hideTagFilter,
            showTagFilter: actions.showTagFilter,
            showFilterTypes: actions.showFilterTypes,
            hideFilterTypes: actions.hideFilterTypes,
            toggleFilterTypes: actions.toggleFilterTypes,
            fetchSuggestedTags: actions.fetchSuggestedTags,
            fetchSuggestedDomains: actions.fetchSuggestedDomains,
        },
        dispatch,
    ),
    onShowOnlyBookmarksChange: () => {
        dispatch(actions.toggleBookmarkFilter())
    },
    clearAllFilters: () => dispatch(actions.resetFilters()),
    // handleFilterClick: source => () => dispatch(actions.setFilterPopup(source)),
    addTagFilter: tag => {
        dispatch(actions.addTagFilter(tag))
        dispatch(actions.fetchSuggestedTags())
    },
    delTagFilter: tag => dispatch(actions.delTagFilter(tag)),
    addDomainFilter: domain => dispatch(actions.addIncDomainFilter(domain)),
    delIncDomainFilter: domain => dispatch(actions.delIncDomainFilter(domain)),
    delExcDomainFilter: domain => dispatch(actions.delExcDomainFilter(domain)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SearchFiltersContainer)
