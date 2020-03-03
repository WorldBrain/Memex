import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RootState } from 'src/options/types'
import { MapDispatchToProps } from 'src/util/types'
import * as actions from 'src/search-filters/actions'
import * as selectors from 'src/search-filters/selectors'

import { Tooltip } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import FilterButton from './filter-button'

import cx from 'classnames'

const styles = require('./tags-filter.css')

interface StateProps {
    tagFilterDropdown: boolean
    tagsInc: string[]
    tagsExc: string[]
    displayTags: object[]
    suggestedTags: string[]
}

interface DispatchProps {
    setTagFilter: (value: boolean) => void
    addIncTagFilter: (tag: string) => void
    delIncTagFilter: (tag: string) => void
    addExcTagFilter: (tag: string) => void
    delExcTagFilter: (tag: string) => void
    clearTagFilters: () => void
    resetFilterPopups: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    tooltipPosition: string
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class TagsFilter extends PureComponent<Props, State> {
    private togglePopup: React.MouseEventHandler<HTMLButtonElement> = e => {
        if (this.props.env === 'inpage' && !this.props.tagFilterDropdown) {
            this.props.resetFilterPopups()
        }

        this.props.tagFilterDropdown
            ? this.props.setTagFilter(false)
            : this.props.setTagFilter(true)
    }

    render() {
        return (
            <FilterButton
                env={this.props.env}
                source="Tags"
                filteredItems={this.props.displayTags}
                togglePopup={this.togglePopup}
                showPopup={this.props.setTagFilter}
                clearFilters={this.props.clearTagFilters}
                disableOnClickOutside={this.props.env === 'inpage'}
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
                            isForRibbon={this.props.env === 'inpage'}
                        />
                    </Tooltip>
                )}
            </FilterButton>
        )
    }
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
): StateProps => ({
    tagsInc: selectors.tags(state),
    tagsExc: selectors.tagsExc(state),
    displayTags: selectors.displayTags(state),
    suggestedTags: selectors.suggestedTags(state),
    tagFilterDropdown: selectors.tagFilter(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
> = dispatch => ({
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
    setTagFilter: value => dispatch(actions.setTagFilter(value)),
    resetFilterPopups: () => dispatch(actions.resetFilterPopups()),
})

export default connect(mapStateToProps, mapDispatchToProps)(TagsFilter)
