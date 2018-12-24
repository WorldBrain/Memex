import React, { Component } from 'react'
import { connect } from 'react-redux'

import Tooltip, { Position } from './tooltip'
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
                >
                    What words do you remember?
                </Tooltip>
            )
        }

        if (whichTooltip === 'time-filters') {
            return (
                <Tooltip position={getBottomCenter('#date-picker', 50, -30)}>
                    <TimeFilterTooltip />
                </Tooltip>
            )
        }

        if (whichTooltip === 'more-filters') {
            return (
                <Tooltip position={getBottomCenter('#filter-icon', 40, -20)}>
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
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TooltipContainer)
