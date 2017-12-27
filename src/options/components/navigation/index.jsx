import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as selectors from '../../imports/selectors'
import * as actions from '../../imports/actions'
import { bindActionCreators } from 'redux'

import Nav from './Nav'
import NavLink from './NavLink'
import * as notificationSelectors from '../../notifications/selectors'

class Navigation extends Component {
    isActive(route) {
        return this.props.currentLocation.pathname === route.pathname
    }

    renderNavLinks() {
        const {
            isRunning,
            isIdle,
            isLoading,
            isStopped,
            isPaused,
            unreadMessagesCount,
        } = this.props

        const state = {
            isRunning: isRunning,
            isIdle: isIdle,
            isLoading: isLoading,
            isStopped: isStopped,
            isPaused: isPaused,
            unreadMessagesCount: unreadMessagesCount,
        }

        return this.props.routes
            .filter(route => !route.hideFromSidebar)
            .map((route, idx) => (
                <NavLink route={route} key={idx} state={state}>
                    {this.isActive(route)}
                </NavLink>
            ))
    }

    render() {
        return <Nav>{this.renderNavLinks()}</Nav>
    }
}

Navigation.propTypes = {
    isRunning: PropTypes.bool.isRequired,
    isIdle: PropTypes.bool.isRequired,
    currentLocation: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isStopped: PropTypes.bool.isRequired,
    isPaused: PropTypes.bool.isRequired,
    unreadMessagesCount: PropTypes.number.isRequired,
}

const mapStateToProps = state => ({
    isRunning: selectors.isRunning(state),
    isPaused: selectors.isPaused(state),
    isStopped: selectors.isStopped(state),
    isLoading: selectors.isLoading(state),
    isIdle: selectors.isIdle(state),
    isStartBtnDisabled: selectors.isStartBtnDisabled(state),
    unreadMessagesCount: notificationSelectors.unreadMessagesCount(state),
})

const mapDispatchToProps = dispatch => ({
    boundActions: bindActionCreators(actions, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(Navigation)
