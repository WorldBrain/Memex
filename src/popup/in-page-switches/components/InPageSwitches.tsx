import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import ToggleIcon from './ToggleIcon'
import { RootState, ClickHandler } from '../../types'
import * as selectors from '../selectors'
import * as acts from '../actions'

const styles = require('./InPageSwitches.css')
const buttonStyles = require('../../components/Button.css')

export interface OwnProps {
    closePopup: () => void
}

interface StateProps {
    isSidebarEnabled: boolean
    isTooltipEnabled: boolean
}

interface DispatchProps {
    handleSidebarChange: ClickHandler<HTMLButtonElement>
    handleTooltipChange: ClickHandler<HTMLButtonElement>
    initState: () => Promise<void>
}

export type Props = OwnProps & StateProps & DispatchProps

class InPageSwitches extends PureComponent<Props> {
    componentDidMount() {
        this.props.initState()
    }

    render() {
        return (
            <Button
                onClick={() => null}
                btnClass={buttonStyles.linkIcon}
                title={'Enable Memex sidebar & Highlighting tooltip'}
            >
                <span>
                    Show Sidebar/Tooltip
                    <span
                        className={styles.switch}
                        title={'Enable Memex sidebar & Highlighting tooltip'}
                    >
                        <ToggleIcon
                            className={[styles.icon, styles.sidebarIcon]}
                            activeClassName={styles.sidebarIconActive}
                            title={'Show/hide annotation sidebar button'}
                            isChecked={this.props.isSidebarEnabled}
                            onChange={this.props.handleSidebarChange}
                        />
                        <ToggleIcon
                            className={[styles.icon, styles.tooltipIcon]}
                            activeClassName={styles.tooltipIconActive}
                            title={
                                'Enable/disable Memex tooltip when you select a piece of text'
                            }
                            isChecked={this.props.isTooltipEnabled}
                            onChange={this.props.handleTooltipChange}
                        />
                    </span>
                </span>
            </Button>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = state => ({
    isSidebarEnabled: selectors.isSidebarEnabled(state),
    isTooltipEnabled: selectors.isTooltipEnabled(state),
})

const mapDispatch: (dispatch, props: OwnProps) => DispatchProps = (
    dispatch,
    props,
) => ({
    handleSidebarChange: async e => {
        e.preventDefault()
        await dispatch(acts.toggleSidebarFlag())
        // setTimeout(props.closePopup, 200)
    },
    handleTooltipChange: async e => {
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
