import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
    SearchFilters,
    BookmarkFilter,
    TagsFilter,
    DomainsFilter,
    DatesFilter,
    ContentTypeContainer,
} from './components'

import * as actions from './actions'

class SearchFiltersContainer extends PureComponent {
    static propTypes = {
        fetchSuggestedTags: PropTypes.func.isRequired,
        fetchSuggestedDomains: PropTypes.func.isRequired,
        toggleFilterBar: PropTypes.func.isRequired,
    }

    componentDidMount() {
        /** fetch initial suggested tags and domains to prepopulate
         filter dropdown **/
        this.props.fetchSuggestedTags()
        this.props.fetchSuggestedDomains()
    }

    renderContentFilter = () => (
        <ContentTypeContainer tooltipPosition="bottom" env="overview" />
    )

    renderTagFilter = () => (
        <TagsFilter tooltipPosition="bottom" env="overview" />
    )

    renderDomainFilter = () => (
        <DomainsFilter tooltipPosition="bottom" env="overview" />
    )

    renderBookmarkFilter = () => <BookmarkFilter />

    renderDateFilter = () => (
        <DatesFilter tooltipPosition="tooltipDate" env="overview" />
    )

    render() {
        return (
            <SearchFilters
                bookmarkFilter={this.renderBookmarkFilter()}
                dateFilter={this.renderDateFilter()}
                tagFilter={this.renderTagFilter()}
                domainFilter={this.renderDomainFilter()}
                contentFilter={this.renderContentFilter()}
                toggleFilterBar={this.props.toggleFilterBar}
            />
        )
    }
}

const mapDispatchToProps = dispatch => ({
    fetchSuggestedTags: () => dispatch(actions.fetchSuggestedTags()),
    fetchSuggestedDomains: () => dispatch(actions.fetchSuggestedDomains()),
    toggleFilterBar: () => dispatch(actions.toggleFilterBar()),
})

export default connect(
    null,
    mapDispatchToProps,
)(SearchFiltersContainer)
