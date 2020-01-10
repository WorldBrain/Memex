import React, { Component } from 'react'
import Nav from './Nav'
import NavLink from './NavLink'

interface Props {
    currentLocation: any
    routes: any[]
}

class Navigation extends Component<Props> {
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

export default Navigation
