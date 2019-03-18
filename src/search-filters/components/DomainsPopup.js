import React, { PureComponent } from 'react'

// import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from './DomainsPopup.module.css'
import { actions, selectors } from '../'
import { selectors as sidebar } from '../../overview/sidebar-left'
// import image from '../../assets/search-solid.svg';
import { FilteredRow } from './'

import IndexDropdownSB from './IndexDropdownSB'

class DomainsPopup extends PureComponent {
    static propTypes = {
        // filteredTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        // addTagFilter: PropTypes.func.isRequired,
        // showTagFilter: PropTypes.func.isRequired,
        // delTagFilter: PropTypes.func.isRequired,
        // tagFilterDropdown: PropTypes.bool.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        // hideTagFilter: PropTypes.func.isRequired,
        // suggestedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        // toggleFilterTypes: PropTypes.func.isRequired,
        // showfilteredTypes: PropTypes.bool.isRequired,
        filteredDomains: PropTypes.arrayOf(PropTypes.object).isRequired,
        addDomainFilter: PropTypes.func.isRequired,
        // showDomainFilter: PropTypes.func.isRequired,
        domainFilterDropdown: PropTypes.bool.isRequired,
        hideDomainFilter: PropTypes.func.isRequired,
        delIncDomainFilter: PropTypes.func.isRequired,
        delExcDomainFilter: PropTypes.func.isRequired,
        // fetchSuggestedDomains: PropTypes.func.isRequired,
        suggestedDomains: PropTypes.arrayOf(PropTypes.object).isRequired,
    }

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

    render() {
        // console.log(this.props.filteredTags)
        return (
            <div className={styles.domainsPopup}>
                {this.renderFilteredDomains()}
                {
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
                }
            </div>
        )
    }
}

const mapStateToProps = state => ({
    filteredDomains: selectors.displayDomains(state),
    domainFilterDropdown: selectors.domainFilter(state),
    suggestedDomains: selectors.suggestedDomains(state),
    // filteredTags: selectors.tags(state),
    isSidebarOpen: sidebar.isSidebarOpen(state),
    // suggestedTags: selectors.suggestedTags(state),
    // tagFilterDropdown: selectors.tagFilter(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            hideDomainFilter: actions.hideDomainFilter,
            showDomainFilter: actions.showDomainFilter,
            // hideTagFilter: actions.hideTagFilter,
            // showTagFilter: actions.showTagFilter,
            // showFilterTypes: actions.showFilterTypes,
            // hideFilterTypes: actions.hideFilterTypes,
            // toggleFilterTypes: actions.toggleFilterTypes,
            // fetchSuggestedTags: actions.fetchSuggestedTags,
            fetchSuggestedDomains: actions.fetchSuggestedDomains,
        },
        dispatch,
    ),
    // onShowOnlyBookmarksChange: () => {
    //     dispatch(actions.toggleBookmarkFilter())
    // },
    // clearAllFilters: () => dispatch(actions.resetFilters()),
    // handleFilterClick: source => () => dispatch(actions.setFilterPopup(source)),
    // addTagFilter: tag => {
    //     dispatch(actions.addTagFilter(tag))
    //     dispatch(actions.fetchSuggestedTags())
    // },
    // delTagFilter: tag => dispatch(actions.delTagFilter(tag)),
    addDomainFilter: domain => dispatch(actions.addIncDomainFilter(domain)),
    delIncDomainFilter: domain => dispatch(actions.delIncDomainFilter(domain)),
    delExcDomainFilter: domain => dispatch(actions.delExcDomainFilter(domain)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DomainsPopup)
