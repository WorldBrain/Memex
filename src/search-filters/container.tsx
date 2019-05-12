import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { MapDispatchToProps } from 'src/util/types'
import { RootState } from 'src/options/types'
import { selectors as results } from 'src/overview/results'
import {
    SearchFilters,
    BookmarkFilter,
    TagsFilter,
    DomainsFilter,
    DatesFilter,
    UsersFilter,
    ContentTypeContainer,
} from './components'

import * as actions from './actions'

interface StateProps {
    isSocialSearch: boolean
}

interface DispatchProps {
    fetchSuggestedTags: () => void
    fetchSuggestedDomains: () => void
    fetchSuggestedUsers: () => void
    toggleFilterBar: () => void
}

interface OwnProps {}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class SearchFiltersContainer extends PureComponent<Props, State> {
    componentDidMount() {
        this.props.fetchSuggestedTags()
        this.props.fetchSuggestedDomains()
        this.props.fetchSuggestedUsers()
    }

    renderContentFilter = () => (
        <ContentTypeContainer tooltipPosition="bottom" env="overview" />
    )

    renderTagFilter = () => (
        <TagsFilter tooltipPosition="bottom" env="overview" />
    )

    renderDomainFilter() {
        if (this.props.isSocialSearch) {
            return null
        }
        return <DomainsFilter tooltipPosition="bottom" env="overview" />
    }

    renderBookmarkFilter = () => <BookmarkFilter />

    renderDateFilter = () => (
        <DatesFilter tooltipPosition="tooltipDate" env="overview" />
    )

    renderUsersFilter = () => (
        <UsersFilter tooltipPosition="bottom" env="overview" />
    )

    render() {
        return (
            <SearchFilters
                bookmarkFilter={this.renderBookmarkFilter()}
                dateFilter={this.renderDateFilter()}
                tagFilter={this.renderTagFilter()}
                domainFilter={this.renderDomainFilter()}
                contentFilter={this.renderContentFilter()}
                userFilter={this.renderUsersFilter()}
                toggleFilterBar={this.props.toggleFilterBar}
            />
        )
    }
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
): StateProps => ({
    isSocialSearch: results.isSocialSearch(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
> = dispatch => ({
    fetchSuggestedTags: () => dispatch(actions.fetchSuggestedTags()),
    fetchSuggestedDomains: () => dispatch(actions.fetchSuggestedDomains()),
    fetchSuggestedUsers: () => dispatch(actions.fetchSuggestedUsers()),
    toggleFilterBar: () => dispatch(actions.toggleFilterBar()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SearchFiltersContainer)
