import React, { Component } from 'react'
import { connect } from 'react-redux'

import Tooltip from './tooltip'
import TimeFilterTooltip from './time-filter-tooltip'
import * as acts from '../actions'
import * as selectors from '../selectors'
import { RootState } from '../../../options/types'
import { getBottomCenter } from '../utils'

export interface Props {
    showTooltip: boolean
    whichTooltip: string
    fetchWhichTooltip: () => void
    fetchOnboardingState: () => void
    closeTooltip: () => void
    previousTooltip: () => void
}

class TooltipContainer extends Component<Props> {
    async componentDidMount() {
        this.props.fetchWhichTooltip()
        this.props.fetchOnboardingState()
    }

    render() {
        const { showTooltip, whichTooltip } = this.props
        if (!showTooltip) {
            return null
        }

        if (whichTooltip === 'search-bar') {
            return (
                <Tooltip
                    position={getBottomCenter('#query-search-bar', 48, 50)}
                    closeTooltip={this.props.closeTooltip}
                >
                    What words do you remember?
                </Tooltip>
            )
        }

        if (whichTooltip === 'time-filters') {
            return (
                <Tooltip
                    position={getBottomCenter('#date-picker', 50, -30)}
                    closeTooltip={this.props.closeTooltip}
                    previousTooltip={this.props.previousTooltip}
                >
                    <TimeFilterTooltip />
                </Tooltip>
            )
        }

        if (whichTooltip === 'more-filters') {
            return (
                <Tooltip
                    position={getBottomCenter('#filter-icon', 40, -20)}
                    closeTooltip={this.props.closeTooltip}
                    previousTooltip={this.props.previousTooltip}
                >
                    <React.Fragment>
                        More <br /> Filters
                    </React.Fragment>
                </Tooltip>
            )
        }

        return null
    }
}

const mapStateToProps: (state: RootState) => Partial<Props> = state => ({
    showTooltip: selectors.showTooltip(state),
    whichTooltip: selectors.whichTooltip(state),
})

const mapDispatchToProps: (dispatch) => Partial<Props> = dispatch => ({
    fetchWhichTooltip: () => {
        dispatch(acts.fetchWhichTooltip())
    },
    fetchOnboardingState: () => {
        dispatch(acts.fetchOnboardingState())
    },
    closeTooltip: () => {
        dispatch(acts.closeTooltip())
    },
    previousTooltip: () => {
        dispatch(acts.previousTooltip())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TooltipContainer)
