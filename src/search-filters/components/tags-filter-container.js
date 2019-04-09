import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { actions, selectors } from 'src/search-filters'
import { Tooltip } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import styles from './tags-filter.css'
import FilterButton from './filter-button'
import cx from 'classnames'

class TagsFilter extends PureComponent {
    static propTypes = {
        env: PropTypes.oneOf(['overview', 'inpage']).isRequired,
        tagsInc: PropTypes.arrayOf(PropTypes.string).isRequired,
        tagsExc: PropTypes.arrayOf(PropTypes.string).isRequired,
        displayTags: PropTypes.arrayOf(PropTypes.object).isRequired,
        suggestedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
        tagFilterDropdown: PropTypes.bool.isRequired,
        tooltipPosition: PropTypes.string.isRequired,
        showTagFilter: PropTypes.func.isRequired,
        hideTagFilter: PropTypes.func.isRequired,
        addIncTagFilter: PropTypes.func.isRequired,
        delIncTagFilter: PropTypes.func.isRequired,
        addExcTagFilter: PropTypes.func.isRequired,
        delExcTagFilter: PropTypes.func.isRequired,
        clearTagFilters: PropTypes.func.isRequired,
    }

    togglePopup = () => {
        this.props.tagFilterDropdown
            ? this.props.hideTagFilter()
            : this.props.showTagFilter()
    }

    render() {
        return (
            <FilterButton
                source="Tags"
                filteredItems={this.props.displayTags}
                togglePopup={this.togglePopup}
                hidePopup={this.props.hideTagFilter}
                clearFilters={this.props.clearTagFilters}
                onFilterDel={this.toggleDelTagFilter}
            >
                {this.props.tagFilterDropdown && (
                    <Tooltip
                        position={this.props.tooltipPosition}
                        itemClass={cx({
                            [styles.tooltip]: this.props.env === 'overview',
                        })}
                    >
                        <IndexDropdown
                            env={this.props.env}
                            onFilterAdd={this.props.addIncTagFilter}
                            onFilterDel={this.props.delIncTagFilter}
                            onExcFilterAdd={this.props.addExcTagFilter}
                            onExcFilterDel={this.props.delExcTagFilter}
                            initFilters={this.props.tagsInc}
                            initExcFilters={this.props.tagsExc}
                            initSuggestions={this.props.suggestedTags}
                            source="tag"
                            isForSidebar
                            isForFilters
                        />
                    </Tooltip>
                )}
            </FilterButton>
        )
    }
}

const mapStateToProps = state => ({
    tagsInc: selectors.tags(state),
    tagsExc: selectors.tagsExc(state),
    displayTags: selectors.displayTags(state),
    suggestedTags: selectors.suggestedTags(state),
    tagFilterDropdown: selectors.tagFilter(state),
})

const mapDispatchToProps = dispatch => ({
    addIncTagFilter: tag => {
        dispatch(actions.addTagFilter(tag))
        dispatch(actions.fetchSuggestedTags())
    },
    delIncTagFilter: tag => dispatch(actions.delTagFilter(tag)),
    addExcTagFilter: tag => dispatch(actions.addExcTagFilter(tag)),
    delExcTagFilter: tag => dispatch(actions.delExcTagFilter(tag)),
    clearTagFilters: () => {
        dispatch(actions.setTagFilters([]))
        dispatch(actions.setExcTagFilters([]))
    },
    showTagFilter: () => dispatch(actions.showTagFilter()),
    hideTagFilter: () => dispatch(actions.hideTagFilter()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TagsFilter)
