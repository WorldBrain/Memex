import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import { ToggleSwitchButton } from '../../components/ToggleSwitchButton'
import type { RootState } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'

const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    closePopup: () => void
}

interface StateProps {
    isEnabled: boolean
}

interface DispatchProps {
    handleChange: React.MouseEventHandler
    showTooltip: React.MouseEventHandler
    initState: () => Promise<void>
}

export type Props = OwnProps & StateProps & DispatchProps

class InPageSwitches extends PureComponent<Props> {
    async componentDidMount() {
        await this.props.initState()
    }

    render() {
        return (
            <ToggleSwitchButton
                btnIcon={buttonStyles.highlighterIcon}
                btnText="Show Highlighter"
                btnHoverText="Open Memex annotation tooltip"
                toggleHoverText="Enable/disable Memex highlighter tooltip on all pages"
                isEnabled={this.props.isEnabled}
                onBtnClick={this.props.showTooltip}
                onToggleClick={this.props.handleChange}
            />
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (state) => ({
    isEnabled: selectors.isTooltipEnabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    showTooltip: async (e) => {
        e.preventDefault()
        await dispatch(acts.showTooltip())
        setTimeout(props.closePopup, 200)
    },
    handleChange: async (e) => {
        e.preventDefault()
        await dispatch(acts.toggleTooltipFlag())
        // setTimeout(props.closePopup, 200)
    },
    initState: () => dispatch(acts.init()),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(InPageSwitches)
