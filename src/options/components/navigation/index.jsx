import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as selectors from '../../imports/selectors'
import * as actions from '../../imports/actions'
import { bindActionCreators } from 'redux'
import setUnreadCount from 'src/util/setUnreadCount'

import Nav from './Nav'
import NavLink from './NavLink'

class Navigation extends Component {
    constructor(props) {
        super(props)

        this.state = {
            notifs: 0,
            unread: false,
        }
    }

    componentDidMount() {
        const updateState = newState =>
            this.setState(oldState => ({ ...oldState, ...newState }))
        const noop = f => f

        this.getInitNotificationState()
            .then(updateState)
            .catch(noop)
    }

    async getInitNotificationState() {
        const res = await setUnreadCount(0)
        return res === 0 ? { unread: false } : { unread: true, notifs: res }
    }

    isActive(route) {
        return this.props.currentLocation.pathname === route.pathname
    }

    renderNavLinks() {
        const { isRunning, isIdle, isLoading, isStopped, isPaused } = this.props

        const state = {
            isRunning: isRunning,
            isIdle: isIdle,
            isLoading: isLoading,
            isStopped: isStopped,
            isPaused: isPaused,
        }

        return this.props.routes
            .filter(route => !route.hideFromSidebar)
            .map((route, idx) => (
                <NavLink
                    route={route}
                    key={idx}
                    state={state}
                    messages={this.state.unread ? this.state.notifs : 0}
                >
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
