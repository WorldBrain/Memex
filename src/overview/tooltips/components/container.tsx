import React, { Component } from 'react'
import { connect } from 'react-redux'

import Tooltip from './tooltip'
import * as acts from '../actions'
import * as selectors from '../selectors'
import { RootState } from '../../../options/types'

export interface Props {
    showTooltip: boolean
    whichTooltip: string
}

class TooltipContainer extends Component<Props> {
    async componentDidMount() {
        // do stage fetching logic here
    }

    render() {
        if (!this.props.showTooltip) {
            return null
        }

        return <Tooltip>This is the new tooltip</Tooltip>
    }
}

const mapStateToProps: (state: RootState) => Partial<Props> = state => ({
    showTooltip: selectors.showTooltip(state),
    tooltip: selectors.tooltip(state),
})

const mapDispatchToProps: (dispatch) => Partial<Props> = dispatch => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TooltipContainer)
