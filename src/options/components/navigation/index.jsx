import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Nav from './Nav'
import NavLink from './NavLink'

class Navigation extends Component {
    isActive(route) {
        return this.props.currentLocation.pathname === route.pathname
    }

    renderNavLinks() {
        return this.props.routes
            .filter(route => !route.hideFromSidebar)
            .map((route, idx) => (
                <NavLink key={idx} isActive={this.isActive(route)} {...route} />
            ))
    }

    render() {
        return <Nav>{this.renderNavLinks()}</Nav>
    }
}

Navigation.propTypes = {
    currentLocation: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
}

export default Navigation
