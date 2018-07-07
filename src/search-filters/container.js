import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
// import { bindActionCreators } from 'redux'

import { selectors as filters } from 'src/overview/filters'
import {
    SearchFilters,
    BookmarkFilter,
    FilterBar,
    FilteredRow,
} from './components'

// temp imports
// import { IndexDropdown, IndexDropdownRow } from 'src/common-ui/components'

class SearchFiltersContainer extends PureComponent {
    static propTypes = {
        filteredTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        filteredDomains: PropTypes.arrayOf(PropTypes.string).isRequired,
    }

    renderBookmarkFilter = () => <BookmarkFilter />

    renderFilteredTags = () => {
        return this.props.filteredTags.map(tag => (
            <FilteredRow value={tag} onClick={() => {}} isActive />
        ))
    }

    renderFilteredDomains = () => {
        return this.props.filteredDomains.map(domain => (
            <FilteredRow value={domain.value} onClick={() => {}} isActive />
        ))
    }

    renderTagFilter = () => <FilterBar filter="Tag" />

    renderDomainFilter = () => <FilterBar filter="Domain" />

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
})

export default connect(
    mapStateToProps,
    // mapDispatchToProps,
    null,
)(SearchFiltersContainer)
