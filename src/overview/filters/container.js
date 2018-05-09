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
        displayDomains: PropTypes.arrayOf(
            PropTypes.shape({
                value: PropTypes.string,
                isExclusive: PropTypes.bool,
            }),
        ).isRequired,
        addTagFilter: PropTypes.func.isRequired,
        delTagFilter: PropTypes.func.isRequired,
        addDomainFilter: PropTypes.func.isRequired,
        delIncDomainFilter: PropTypes.func.isRequired,
        delExcDomainFilter: PropTypes.func.isRequired,
        setFilterPopup: PropTypes.func.isRequired,
    }

    handleTagPillClick = value => event => {
        event.preventDefault()

        this.props.delTagFilter(value)
    }

    handleDomainPillClick = ({ value, isExclusive }) => event => {
        if (isExclusive) {
            this.props.delExcDomainFilter(value)
        } else {
            this.props.delIncDomainFilter(value)
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

    renderDomainsFilter() {
        if (!this.props.showDomainsFilter) {
            return null
        }

        return (
            <IndexDropdown
                onFilterAdd={this.props.addDomainFilter}
                onFilterDel={this.props.delIncDomainFilter}
                initFilters={this.props.filterDomains}
                source="domain"
            />
        )
    }

    renderDomainsFilterPills() {
        const pills = this.props.displayDomains
            .slice(0, SHOWN_FILTER_LIMIT)
            .map((data, i) => (
                <FilterPill
                    key={i}
                    {...data}
                    onClick={this.handleDomainPillClick(data)}
                />
            ))

        return [
            ...pills,
            ...this._appendExpandPillsBtn('domain', this.props.filterDomains),
        ]
    }

    renderTagsFilterPills() {
        const pills = this.props.filterTags
            .slice(0, SHOWN_FILTER_LIMIT)
            .map((value, i) => (
                <FilterPill
                    key={i}
                    value={value}
                    onClick={this.handleTagPillClick(value)}
                />
            ))

        return [
            ...pills,
            ...this._appendExpandPillsBtn('tag', this.props.filterTags),
        ]
    }

    _appendExpandPillsBtn(source, data) {
        // Add on dummy pill with '+' sign if over limit
        if (data.length > SHOWN_FILTER_LIMIT) {
            return [
                <ExpandButton
                    key="+"
                    setRef={this.addFurtherTagRef}
                    value={`+${data.length - SHOWN_FILTER_LIMIT}`}
                    onClick={this.props.setFilterPopup(source)}
                    noBg
                />,
            ]
        }

        return []
    }

    render() {
        return (
            <Filters
                {...this.props}
                tagFilterManager={this.renderTagsFilter()}
                domainFilterManager={this.renderDomainsFilter()}
                tagFilterPills={this.renderTagsFilterPills()}
                domainFilterPills={this.renderDomainsFilterPills()}
            />
        )
    }
}

const mapStateToProps = state => ({
    showOnlyBookmarks: selectors.onlyBookmarks(state),
    isClearFilterButtonShown: selectors.showClearFiltersBtn(state),
    filterTags: selectors.tags(state),
    displayDomains: selectors.displayDomains(state),
    filterDomains: selectors.domainsInc(state),
    showTagsFilter: selectors.showTagsFilter(state),
    showDomainsFilter: selectors.showDomainsFilter(state),
})

const mapDispatchToProps = dispatch => ({
    onShowOnlyBookmarksChange: () => dispatch(actions.toggleBookmarkFilter()),
    clearAllFilters: () => dispatch(actions.resetFilters()),
    handleFilterClick: source => () => dispatch(actions.setFilterPopup(source)),
    addTagFilter: tag => dispatch(actions.addTagFilter(tag)),
    delTagFilter: tag => dispatch(actions.delTagFilter(tag)),
    addDomainFilter: domain => dispatch(actions.addIncDomainFilter(domain)),
    delIncDomainFilter: domain => dispatch(actions.delIncDomainFilter(domain)),
    delExcDomainFilter: domain => dispatch(actions.delExcDomainFilter(domain)),
    setFilterPopup: source => event => {
        event.preventDefault()
        dispatch(actions.setFilterPopup(source))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(FiltersContainer)
