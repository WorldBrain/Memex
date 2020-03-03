import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RootState } from 'src/options/types'
import { MapDispatchToProps } from 'src/util/types'
import * as actions from 'src/search-filters/actions'
import * as selectors from 'src/search-filters/selectors'

import { Tooltip } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import FilterButton from './filter-button'
import { selectors as results } from 'src/overview/results'

import cx from 'classnames'

const styles = require('./tags-filter.css')

interface StateProps {
    tagFilterDropdown: boolean
    hashtagsInc: string[]
    hashtagsExc: string[]
    displayHashtags: object[]
    suggestedHashtags: string[]
    isSocialSearch: boolean
}

interface DispatchProps {
    setHashtagFilter: (value: boolean) => void
    addIncHashtagFilter: (tag: string) => void
    delIncHashtagFilter: (tag: string) => void
    addExcHashtagFilter: (tag: string) => void
    delExcHashtagFilter: (tag: string) => void
    clearTagFilters: () => void
    resetFilterPopups: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    tooltipPosition: string
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class HashtagsFilter extends PureComponent<Props, State> {
    private togglePopup: React.MouseEventHandler<HTMLButtonElement> = e => {
        if (this.props.env === 'inpage' && !this.props.tagFilterDropdown) {
            this.props.resetFilterPopups()
        }

        this.props.tagFilterDropdown
            ? this.props.setHashtagFilter(false)
            : this.props.setHashtagFilter(true)
    }

    render() {
        if (!this.props.isSocialSearch) {
            return null
        }

        return (
            <FilterButton
                env={this.props.env}
                source="Hashtags"
                filteredItems={this.props.displayHashtags}
                togglePopup={this.togglePopup}
                showPopup={this.props.setHashtagFilter}
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
                            onFilterAdd={this.props.addIncHashtagFilter}
                            onFilterDel={this.props.delIncHashtagFilter}
                            onExcFilterAdd={this.props.addExcHashtagFilter}
                            onExcFilterDel={this.props.delExcHashtagFilter}
                            initFilters={this.props.hashtagsInc}
                            initExcFilters={this.props.hashtagsExc}
                            initSuggestions={this.props.suggestedHashtags}
                            source="hashtag"
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
    hashtagsInc: selectors.hashtagsInc(state),
    hashtagsExc: selectors.hashtagsExc(state),
    displayHashtags: selectors.displayHashtags(state),
    suggestedHashtags: selectors.suggestedHashtags(state),
    tagFilterDropdown: selectors.hashtagFilter(state),
    isSocialSearch: results.isSocialPost(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
> = dispatch => ({
    addIncHashtagFilter: tag => dispatch(actions.addIncHashtagFilter(tag)),
    delIncHashtagFilter: tag => dispatch(actions.delIncHashtagFilter(tag)),
    addExcHashtagFilter: tag => dispatch(actions.addExcHashtagFilter(tag)),
    delExcHashtagFilter: tag => dispatch(actions.delExcHashtagFilter(tag)),
    clearTagFilters: () => {
        dispatch(actions.setIncHashtagFilters([]))
        dispatch(actions.setExcHashtagFilters([]))
    },
    setHashtagFilter: value => dispatch(actions.setHashtagFilter(value)),
    resetFilterPopups: () => dispatch(actions.resetFilterPopups()),
})

export default connect(mapStateToProps, mapDispatchToProps)(HashtagsFilter)
