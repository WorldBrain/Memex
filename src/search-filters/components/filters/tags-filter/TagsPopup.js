import React, { PureComponent } from 'react'

// import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styles from '../../stylesheets/tags-filter-styles/TagsPopup.module.css'
import { actions, selectors } from '../../../'
import { selectors as sidebar } from '../../../../overview/sidebar-left'
// import image from '../../assets/search-solid.svg';
// import { FilteredRow } from '../../'

import IndexDropdownKS from '../../IndexDropdownKS'

class TagsPopup extends PureComponent {
    static propTypes = {
        filteredTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        addTagFilter: PropTypes.func.isRequired,
        // showTagFilter: PropTypes.func.isRequired,
        delTagFilter: PropTypes.func.isRequired,
        tagFilterDropdown: PropTypes.bool.isRequired,
        checkCount: PropTypes.func.isRequired,
        checkTags: PropTypes.func.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        hideTagFilter: PropTypes.func.isRequired,
        // isNew: PropTypes.bool.isRequired,
        suggestedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        // toggleFilterTypes: PropTypes.func.isRequired,
        // showfilteredTypes: PropTypes.bool.isRequired,
    }

    // state = {
    //     countResult: 0,
    // }

    // countResult = countResult => {
    //     this.setState({ countResult: countResult })
    // }

    renderFilteredTags = () => {
        return !this.props.tagFilterDropdown
            ? this.props.filteredTags.map((tag, i) => (
                  <span className={styles.tagPill}>
                      <span>
                          {tag}
                          {'  '}
                      </span>
                      <button
                          onClick={() => this.props.delTagFilter(tag)}
                          className={styles.cross}
                      />
                  </span>
              ))
            : null
    }

    // <FilteredRow
    // key={i}
    // value={tag}
    // onClick={() => this.props.delTagFilter(tag)}
    // active
    // />

    render() {
        // console.log(this.props.filteredTags)
        let count = 0
        const arr = Object.values(this.props.filteredTags)
        arr.map(type => {
            if (type) {
                count++
            }
        })
        this.props.checkCount(count)
        this.props.checkTags(arr)
        return (
            <div className={styles.tagsPopup}>
                {count > 0 ? (
                    <div className={styles.selected}>Selected</div>
                ) : null}
                <div className={styles.selectedTags}>
                    {/* this.renderFilteredTags() */}
                </div>
                {
                    <IndexDropdownKS
                        // checkResultCount={this.countResult}
                        onFilterAdd={this.props.addTagFilter}
                        onFilterDel={this.props.delTagFilter}
                        initFilters={this.props.filteredTags}
                        initSuggestions={this.props.suggestedTags}
                        source="tag"
                        isSidebarOpen={this.props.isSidebarOpen}
                        closeDropdown={this.props.hideTagFilter}
                    />
                }
            </div>
        )
    }
}

const mapStateToProps = state => ({
    filteredTags: selectors.tags(state),
    isSidebarOpen: sidebar.isSidebarOpen(state),
    suggestedTags: selectors.suggestedTags(state),
    tagFilterDropdown: selectors.tagFilter(state),
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
    handleFilterClick: source => () => dispatch(actions.setFilterPopup(source)),
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
