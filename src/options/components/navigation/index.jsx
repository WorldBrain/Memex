import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as selectors from '../../imports/selectors'
import * as actions from '../../imports/actions'
import styles from './styles.css'
import { bindActionCreators } from 'redux'

import Nav from './Nav'

class Navigation extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { routes } = this.props
        const { isRunning, isIdle, isLoading } = this.props
        const state = {
            isRunning: isRunning,
            isIdle: isIdle,
            isLoading: isLoading,
        }

        return (
            <Nav
                routes={routes}
                currentLocation={this.props.currentLocation}
                state={state}
            />
        )
    }
}

Navigation.propTypes = {
    isRunning: PropTypes.bool.isRequired,
    isIdle: PropTypes.bool.isRequired,
    currentLocation: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
}

const mapStateToProps = state => ({
    isRunning: selectors.isRunning(state),
    isPaused: selectors.isPaused(state),
    isStopped: selectors.isStopped(state),
    isLoading: selectors.isLoading(state),
    isIdle: selectors.isIdle(state),
    isStartBtnDisabled: selectors.isStartBtnDisabled(state),
})

const mapDispatchToProps = dispatch => ({
    boundActions: bindActionCreators(actions, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(Navigation)
