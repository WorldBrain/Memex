import React, { Component } from 'react'
import { connect } from 'react-redux'

import Tooltip from './tooltip'
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
        console.log(this.props)
        if (!this.props.showTooltip) {
            return null
        }

        return <Tooltip>This is the new tooltip</Tooltip>
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
