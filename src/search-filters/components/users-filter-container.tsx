import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RootState } from 'src/options/types'
import { MapDispatchToProps } from 'src/util/types'
import * as actions from 'src/search-filters/actions'
import * as selectors from 'src/search-filters/selectors'

import { Tooltip } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import FilterButton from './filter-button'
import { User } from 'src/social-integration/types'
import { selectors as results } from 'src/overview/results'

import cx from 'classnames'

const styles = require('./tags-filter.css')

interface StateProps {
    userFilterDropdown: boolean
    usersInc: User[]
    usersExc: User[]
    displayUsers: User[]
    suggestedUsers: User[]
    isSocialSearch: boolean
}

interface DispatchProps {
    setUserFilter: (value: boolean) => void
    addIncUserFilter: (user: User) => void
    delIncUserFilter: (user: User) => void
    addExcUserFilter: (user: User) => void
    delExcUserFilter: (user: User) => void
    clearUserFilters: () => void
    resetFilterPopups: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    tooltipPosition: string
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class UsersFilter extends PureComponent<Props, State> {
    private togglePopup: React.MouseEventHandler<HTMLButtonElement> = e => {
        if (this.props.env === 'inpage' && !this.props.userFilterDropdown) {
            this.props.resetFilterPopups()
        }

        this.props.userFilterDropdown
            ? this.props.setUserFilter(false)
            : this.props.setUserFilter(true)
    }

    render() {
        if (!this.props.isSocialSearch) {
            return null
        }

        return (
            <FilterButton
                env={this.props.env}
                source="Users"
                filteredItems={this.props.displayUsers}
                togglePopup={this.togglePopup}
                showPopup={this.props.setUserFilter}
                clearFilters={this.props.clearUserFilters}
                disableOnClickOutside={this.props.env === 'inpage'}
            >
                {this.props.userFilterDropdown && (
                    <Tooltip
                        position={this.props.tooltipPosition}
                        itemClass={cx({
                            [styles.tooltip]: this.props.env === 'overview',
                        })}
                    >
                        <IndexDropdown
                            env={this.props.env}
                            onFilterAdd={this.props.addIncUserFilter}
                            onFilterDel={this.props.delIncUserFilter}
                            onExcFilterAdd={this.props.addExcUserFilter}
                            onExcFilterDel={this.props.delExcUserFilter}
                            initFilters={this.props.usersInc}
                            initExcFilters={this.props.usersExc}
                            initSuggestions={this.props.suggestedUsers}
                            source="user"
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
    usersInc: selectors.usersInc(state),
    usersExc: selectors.usersExc(state),
    displayUsers: selectors.displayUsers(state),
    suggestedUsers: selectors.suggestedUsers(state),
    userFilterDropdown: selectors.userFilter(state),
    isSocialSearch: results.isSocialPost(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
> = dispatch => ({
    addIncUserFilter: user => {
        dispatch(actions.addIncUserFilter(user))
        // dispatch(actions.fetchSuggestedUsers())
    },
    delIncUserFilter: user => dispatch(actions.delIncUserFilter(user)),
    addExcUserFilter: user => dispatch(actions.addExcUserFilter(user)),
    delExcUserFilter: user => dispatch(actions.delExcUserFilter(user)),
    clearUserFilters: () => {
        dispatch(actions.setIncUserFilters([]))
        dispatch(actions.setExcUserFilters([]))
    },
    setUserFilter: value => dispatch(actions.setUserFilter(value)),
    resetFilterPopups: () => dispatch(actions.resetFilterPopups()),
})

export default connect(mapStateToProps, mapDispatchToProps)(UsersFilter)
