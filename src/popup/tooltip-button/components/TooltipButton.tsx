import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import ToggleSwitch from './ToggleSwitch'
import { RootState, ClickHandler } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'

const styles = require('./TooltipButton.css')
const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    closePopup: () => void
}

interface StateProps {
    isChecked: boolean
}

interface DispatchProps {
    handleChange: ClickHandler<HTMLButtonElement>
    initState: () => Promise<void>
}

export type Props = OwnProps & StateProps & DispatchProps

class TooltipButton extends PureComponent<Props> {
    componentDidMount() {
        this.props.initState()
    }

    render() {
        return (
            <Button
                onClick={this.props.handleChange}
                btnClass={buttonStyles.linkIcon}
                title={'Enable Memex sidebar & Highlighting tooltip'}
            >
                <span>
                    Show Sidebar/Tooltip
                    <span
                        className={styles.switch}
                        title={'Enable Memex sidebar & Highlighting tooltip'}
                    >
                        <ToggleSwitch
                            isChecked={this.props.isChecked}
                            onChange={this.props.handleChange}
                        />
                    </span>
                </span>
            </Button>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isChecked: selectors.isTooltipEnabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    handleChange: async e => {
        e.preventDefault()
        await dispatch(acts.toggleTooltipFlag())
        setTimeout(props.closePopup, 200)
    },
    initState: () => dispatch(acts.init()),
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(TooltipButton)
