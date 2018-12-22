import React, { Component } from 'react'
import { connect } from 'react-redux'

import Tooltip, { Position } from './tooltip'
import TimeFilterTooltip from './time-filter-tooltip'
import * as acts from '../actions'
import * as selectors from '../selectors'
import { RootState } from '../../../options/types'

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

        let position: Position

        if (whichTooltip === 'search-bar') {
            position = {
                top: 100,
                left: '30%',
            }
            return (
                <Tooltip position={position}>
                    What words do you remember?
                </Tooltip>
            )
        }

        if (whichTooltip === 'time-filters') {
            position = {
                top: 100,
                left: '50%',
            }
            return (
                <Tooltip position={position}>
                    <TimeFilterTooltip />
                </Tooltip>
            )
        }

        if (whichTooltip === 'more-filters') {
            position = {
                top: 200,
                left: 20,
            }
            return (
                <Tooltip position={position}>
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
