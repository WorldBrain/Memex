import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import {
    selectors as filters,
    actions as filterActs,
} from 'src/overview/filters'
import { Checkbox } from 'src/common-ui/components'
import {
    SearchFilters,
    BookmarkFilter,
    FilterBar,
    FilteredRow,
    IndexDropdownSB,
} from './components'
import { actions, selectors } from './'
import { selectors as sidebar } from '../overview/sidebar-left'

class SearchFiltersContainer extends PureComponent {
    static propTypes = {
        filteredTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        filteredDomains: PropTypes.arrayOf(PropTypes.string).isRequired,
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
    }

    renderBookmarkFilter = () => <BookmarkFilter />

    renderFilteredTags = () => {
        return !this.props.tagFilterDropdown
            ? this.props.filteredTags.map((tag, i) => (
                  <FilteredRow
                      key={i}
                      value={tag}
                      onClick={tag => this.props.addTagFilter(tag)}
                      active
                  />
              ))
            : null
    }

    renderFilteredDomains = () => {
        return !this.props.domainFilterDropdown
            ? this.props.filteredDomains.map(({ value }, i) => (
                  <FilteredRow
                      key={i}
                      value={value}
                      onClick={value => this.props.addDomainFilter(value)}
                      active
                  />
              ))
            : null
    }

    renderTagFilter = () =>
        !this.props.tagFilterDropdown ? (
            <FilterBar onBarClick={this.props.showTagFilter} filter="Tag" />
        ) : (
            <IndexDropdownSB
                onFilterAdd={this.props.addTagFilter}
                onFilterDel={this.props.delTagFilter}
                initFilters={this.props.filteredTags}
                initSuggestions={this.props.filteredTags}
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
                initFilters={this.props.filteredDomains}
                initSuggestions={this.props.filteredDomains}
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

    renderTypeFilter = () => (
        <FilterBar onBarClick={this.props.showTagFilter} filter="Type" />
    )

    render() {
        return (
            <SearchFilters
                bookmarkFilter={this.renderBookmarkFilter()}
                tagFilter={this.renderTagFilter()}
                domainFilter={this.renderDomainFilter()}
                filteredTags={this.renderFilteredTags()}
                filteredDomains={this.renderFilteredDomains()}
                typeFilters={this.renderTypeFilter()}
            />
        )
    }
}

const mapStateToProps = state => ({
    filteredTags: filters.tags(state),
    filteredDomains: filters.displayDomains(state),
    domainFilterDropdown: selectors.domainFilter(state),
    tagFilterDropdown: selectors.tagFilter(state),
    bookmarkFilter: filters.onlyBookmarks(state),
    isSidebarOpen: sidebar.isSidebarOpen(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            hideDomainFilter: actions.hideDomainFilter,
            showDomainFilter: actions.showDomainFilter,
            hideTagFilter: actions.hideTagFilter,
            showTagFilter: actions.showTagFilter,
        },
        dispatch,
    ),
    onShowOnlyBookmarksChange: () => {
        dispatch(filterActs.toggleBookmarkFilter())
    },
    clearAllFilters: () => dispatch(filterActs.resetFilters()),
    // handleFilterClick: source => () => dispatch(filterActs.setFilterPopup(source)),
    addTagFilter: tag => dispatch(filterActs.addTagFilter(tag)),
    delTagFilter: tag => dispatch(filterActs.delTagFilter(tag)),
    addDomainFilter: domain => dispatch(filterActs.addIncDomainFilter(domain)),
    delIncDomainFilter: domain =>
        dispatch(filterActs.delIncDomainFilter(domain)),
    delExcDomainFilter: domain =>
        dispatch(filterActs.delExcDomainFilter(domain)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SearchFiltersContainer)
