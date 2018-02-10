import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { IndexDropdown } from 'src/common-ui/containers'
import Filters from './components/Filters'
import FilterPill from './components/FilterPill'
import ExpandButton from './components/ExpandButton'
import * as actions from './actions'
import * as selectors from './selectors'
import { SHOWN_FILTER_LIMIT } from '../constants'

class FiltersContainer extends PureComponent {
    static propTypes = {
        showDomainsFilter: PropTypes.bool.isRequired,
        showTagsFilter: PropTypes.bool.isRequired,
        filterTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        filterDomains: PropTypes.arrayOf(PropTypes.string).isRequired,
        addTagFilter: PropTypes.func.isRequired,
        delTagFilter: PropTypes.func.isRequired,
        addDomainFilter: PropTypes.func.isRequired,
        delDomainFilter: PropTypes.func.isRequired,
        setFilterPopup: PropTypes.func.isRequired,
    }

    handlePillClick = (filter, source) => event => {
        event.preventDefault()

        if (source === 'tag') {
            this.props.delTagFilter(filter)
        } else {
            this.props.delDomainFilter(filter)
        }
    }

    renderTagsFilter = () =>
        this.props.showTagsFilter ? (
            <IndexDropdown
                onFilterAdd={this.props.addTagFilter}
                onFilterDel={this.props.delTagFilter}
                initFilters={this.props.filterTags}
                source="tag"
            />
        ) : null

    renderDomainsFilter = () =>
        this.props.showDomainsFilter ? (
            <IndexDropdown
                onFilterAdd={this.props.addDomainFilter}
                onFilterDel={this.props.delDomainFilter}
                initFilters={this.props.filterDomains}
                source="domain"
            />
        ) : null

    renderFilterPills = source => data => {
        const filterPills = data
            .slice(0, SHOWN_FILTER_LIMIT)
            .map((value, i) => (
                <FilterPill
                    key={i}
                    value={value}
                    onClick={this.handlePillClick(value, source)}
                />
            ))

        // Add on dummy pill with '+' sign if over limit
        if (data.length > SHOWN_FILTER_LIMIT) {
            return [
                ...filterPills,
                <ExpandButton
                    key="+"
                    setRef={this.addFurtherTagRef}
                    value={`+${data.length - SHOWN_FILTER_LIMIT}`}
                    onClick={this.props.setFilterPopup(source)}
                    noBg
                />,
            ]
        }

        return filterPills
    }

    render() {
        return (
            <Filters
                {...this.props}
                tagFilterManager={this.renderTagsFilter()}
                domainFilterManager={this.renderDomainsFilter()}
                tagFilterPills={this.renderFilterPills('tag')(
                    this.props.filterTags,
                )}
                domainFilterPills={this.renderFilterPills('domain')(
                    this.props.filterDomains,
                )}
            />
        )
    }
}

const mapStateToProps = state => ({
    showOnlyBookmarks: selectors.onlyBookmarks(state),
    isClearFilterButtonShown: selectors.showClearFiltersBtn(state),
    filterTags: selectors.tags(state),
    filterDomains: selectors.domains(state),
    showTagsFilter: selectors.showTagsFilter(state),
    showDomainsFilter: selectors.showDomainsFilter(state),
})

const mapDispatchToProps = dispatch => ({
    onShowOnlyBookmarksChange: () => dispatch(actions.toggleBookmarkFilter()),
    clearAllFilters: () => dispatch(actions.resetFilters()),
    handleFilterClick: source => () => dispatch(actions.setFilterPopup(source)),
    addTagFilter: tag => dispatch(actions.addTagFilter(tag)),
    delTagFilter: tag => dispatch(actions.delTagFilter(tag)),
    addDomainFilter: domain => dispatch(actions.addDomainFilter(domain)),
    delDomainFilter: domain => dispatch(actions.delDomainFilter(domain)),
    setFilterPopup: source => event => {
        event.preventDefault()
        dispatch(actions.setFilterPopup(source))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(FiltersContainer)
