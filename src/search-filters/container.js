import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import {
    selectors as filters,
    actions as filterActs,
} from 'src/overview/filters'
import {
    SearchFilters,
    BookmarkFilter,
    FilterBar,
    FilteredRow,
} from './components'
import { actions, selectors } from './'
import { IndexDropdown } from 'src/common-ui/containers'

class SearchFiltersContainer extends PureComponent {
    static propTypes = {
        filteredTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        filteredDomains: PropTypes.arrayOf(PropTypes.string).isRequired,
        addTagFilter: PropTypes.func.isRequired,
        delTagFilter: PropTypes.func.isRequired,
        addDomainFilter: PropTypes.func.isRequired,
        showDomainFilter: PropTypes.func.isRequired,
        showTagFilter: PropTypes.func.isRequired,
        delIncDomainFilter: PropTypes.func.isRequired,
        tagFilterDropdown: PropTypes.bool.isRequired,
        domainFilterDropdown: PropTypes.bool.isRequired,
    }

    renderBookmarkFilter = () => <BookmarkFilter />

    renderFilteredTags = () => {
        return this.props.tagFilterDropdown ? (
            <IndexDropdown
                onFilterAdd={this.props.addTagFilter}
                onFilterDel={this.props.delTagFilter}
                initFilters={this.props.filteredTags}
                isForSidebar
                initSuggestions={this.props.filteredTags}
                source="tag"
            />
        ) : (
            this.props.filteredTags.map(tag => (
                <FilteredRow value={tag} onClick={() => {}} active />
            ))
        )
    }

    renderFilteredDomains = () => {
        return this.props.domainFilterDropdown ? (
            <IndexDropdown
                onFilterAdd={this.props.addDomainFilter}
                onFilterDel={this.props.delIncDomainFilter}
                initFilters={this.props.filteredDomains}
                isForSidebar
                initSuggestions={this.props.filteredDomains}
                source="domain"
            />
        ) : (
            this.props.filteredDomains.map(domain => (
                <FilteredRow value={domain.value} onClick={() => {}} active />
            ))
        )
    }

    renderTagFilter = () =>
        !this.props.tagFilterDropdown ? (
            <FilterBar onBarClick={this.props.showTagFilter} filter="Tag" />
        ) : null

    renderDomainFilter = () =>
        !this.props.domainFilterDropdown ? (
            <FilterBar
                onBarClick={this.props.showDomainFilter}
                filter="Domain"
            />
        ) : null

    render() {
        return (
            <SearchFilters
                bookmarkFilter={this.renderBookmarkFilter()}
                tagFilter={this.renderTagFilter()}
                domainFilter={this.renderDomainFilter()}
                filteredTags={this.renderFilteredTags()}
                filteredDomains={this.renderFilteredDomains()}
            />
        )
    }
}

const mapStateToProps = state => ({
    filteredTags: filters.tags(state),
    filteredDomains: filters.displayDomains(state),
    domainFilterDropdown: selectors.domainFilter(state),
    tagFilterDropdown: selectors.tagFilter(state),
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
    onShowOnlyBookmarksChange: () =>
        dispatch(filterActs.toggleBookmarkFilter()),
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
