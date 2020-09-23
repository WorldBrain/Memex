import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import ToggleSwitch from '../../components/ToggleSwitch'
import { RootState, ClickHandler } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'

const styles = require('./TooltipButton.css')
const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    closePopup: () => void
}

interface StateProps {
    isEnabled: boolean
}

interface DispatchProps {
    handleChange: ClickHandler<HTMLButtonElement>
    showTooltip: ClickHandler<HTMLButtonElement>
    initState: () => Promise<void>
}

export type Props = OwnProps & StateProps & DispatchProps

class InPageSwitches extends PureComponent<Props> {
    componentDidMount() {
        this.props.initState()
    }

    render() {
        return (
            <div className={styles.switchBlocks}>
                <div className={styles.option}>
                    <Button
                        onClick={this.props.showTooltip}
                        itemClass={styles.button}
                        btnClass={buttonStyles.highlighterIcon}
                        title={'Open Memex annotation tooltip'}
                    >
                        Enable Highlighter
                    </Button>
                </div>
                <div
                    className={styles.switch}
                    title={
                        'Enable/disable Memex highlighter tooltip on all pages'
                    }
                >
                    <ToggleSwitch
                        isChecked={this.props.isEnabled}
                        onChange={this.props.handleChange}
                    />
                </div>
            </div>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isEnabled: selectors.isTooltipEnabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    showTooltip: async e => {
        e.preventDefault()
        await dispatch(acts.showTooltip())
        setTimeout(props.closePopup, 200)
    },
    handleChange: async e => {
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
