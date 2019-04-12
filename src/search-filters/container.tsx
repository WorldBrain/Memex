import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { MapDispatchToProps } from 'src/util/types'
import { RootState } from 'src/options/types'

import {
    SearchFilters,
    BookmarkFilter,
    TagsFilter,
    DomainsFilter,
    DatesFilter,
    ContentTypeContainer,
} from './components'

import * as actions from './actions'

interface StateProps {}

interface DispatchProps {
    fetchSuggestedTags: () => void
    fetchSuggestedDomains: () => void
    toggleFilterBar: () => void
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class SearchFiltersContainer extends PureComponent<Props, State> {
    componentDidMount() {
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

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
> = dispatch => ({
    fetchSuggestedTags: () => dispatch(actions.fetchSuggestedTags()),
    fetchSuggestedDomains: () => dispatch(actions.fetchSuggestedDomains()),
    toggleFilterBar: () => dispatch(actions.toggleFilterBar()),
})

export default connect(
    null,
    mapDispatchToProps,
)(SearchFiltersContainer)
