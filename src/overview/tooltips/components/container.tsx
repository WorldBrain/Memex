import React, { Component } from 'react'
import { connect } from 'react-redux'

import Tooltip from './tooltip'
import TimeFilterTooltip from './time-filter-tooltip'
import * as acts from '../actions'
import * as selectors from '../selectors'
import { RootState } from '../../../options/types'
import { getBottomCenter } from '../utils'

const styles = require('./tooltip.css')

export interface Props {
    showTooltip: boolean
    tooltip: string
    fetchWhichTooltip: () => void
    fetchOnboardingState: () => void
    closeTooltip: () => void
    nextTooltip: () => void
    previousTooltip: () => void
}

class TooltipContainer extends Component<Props> {
    async componentDidMount() {
        this.props.fetchOnboardingState()
    }

    render() {
        const { showTooltip, tooltip } = this.props
        if (!showTooltip) {
            return null
        }

        if (tooltip === 'search-bar') {
            return (
                <Tooltip
                    position={getBottomCenter('#query-search-bar', 20, 70)}
                    nextTooltip={this.props.nextTooltip}
                    closeTooltip={this.props.closeTooltip}
                >
                    <div>
                        Search with any word you remember from a website you've
                        seen before
                        <p className={styles.subInfo}>
                            Make sure you visited some, or{' '}
                            <a target="_blank" href="#import">
                                imported your existing history
                            </a>
                        </p>
                    </div>
                </Tooltip>
            )
        }

        if (tooltip === 'time-filters') {
            return (
                <Tooltip
                    position={getBottomCenter('#date-picker', 20, 80)}
                    closeTooltip={this.props.closeTooltip}
                    nextTooltip={this.props.nextTooltip}
                    previousTooltip={this.props.previousTooltip}
                >
                    <TimeFilterTooltip />
                </Tooltip>
            )
        }

        if (tooltip === 'more-filters') {
            return (
                <Tooltip
                    position={getBottomCenter('#filter-icon', 20, -10)}
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
    tooltip: selectors.tooltip(state),
})

const mapDispatchToProps: (dispatch) => Partial<Props> = dispatch => ({
    fetchOnboardingState: () => {
        dispatch(acts.fetchOnboardingState())
    },
    closeTooltip: () => {
        dispatch(acts.closeTooltip())
    },
    nextTooltip: () => {
        dispatch(acts.nextTooltip())
    },
    previousTooltip: () => {
        dispatch(acts.previousTooltip())
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TooltipContainer)
