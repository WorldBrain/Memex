import React, { PureComponent } from 'react'

// import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from '../../stylesheets/tags-filter-styles/TagsPopup.module.css'
import { actions, selectors } from '../../../'
import { selectors as sidebar } from '../../../../overview/sidebar-left'
// import image from '../../assets/search-solid.svg';

import IndexDropdownSB from '../../IndexDropdownSB'

class TagsPopup extends PureComponent {
    static propTypes = {
        addTagFilter: PropTypes.func.isRequired,
        // showTagFilter: PropTypes.func.isRequired,
        filteredTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        delTagFilter: PropTypes.func.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        hideTagFilter: PropTypes.func.isRequired,
        suggestedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        // toggleFilterTypes: PropTypes.func.isRequired,
        // showfilteredTypes: PropTypes.bool.isRequired,
    }

    render() {
        return (
            <div className={styles.tagsPopup}>
                <IndexDropdownSB
                    onFilterAdd={this.props.addTagFilter}
                    onFilterDel={this.props.delTagFilter}
                    initFilters={this.props.filteredTags}
                    initSuggestions={this.props.suggestedTags}
                    source="tag"
                    isSidebarOpen={this.props.isSidebarOpen}
                    closeDropdown={this.props.hideTagFilter}
                />
            </div>
        )
    }
}

const mapStateToProps = state => ({
    filteredTags: selectors.tags(state),
    isSidebarOpen: sidebar.isSidebarOpen(state),
    suggestedTags: selectors.suggestedTags(state),
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
    // handleFilterClick: source => () => dispatch(actions.setFilterPopup(source)),
    addTagFilter: tag => {
        dispatch(actions.addTagFilter(tag))
        dispatch(actions.fetchSuggestedTags())
    },
    delTagFilter: tag => dispatch(actions.delTagFilter(tag)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TagsPopup)
