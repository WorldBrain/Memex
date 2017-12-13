import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Navigation from './components/navigation'
import routes from './routes'
import Head from './containers/Head'
import styles from './base.css'

class Layout extends Component {
    isActive = route => this.props.location.pathname === route.pathname

    render() {
        const { children, location } = this.props
        const currentRoute = routes.find(this.isActive)
        const hideSidebar = currentRoute.hideSidebar

        return (
            <div
                className={`${styles.root} ${hideSidebar
                    ? ''
                    : styles.sidebar}`}
            >
                <Head />
                {!hideSidebar && (
                    <Navigation currentLocation={location} routes={routes} />
                )}
                <div className={styles.route}>{children}</div>
            </div>
        )
    }
}

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired,
}

export default Layout
