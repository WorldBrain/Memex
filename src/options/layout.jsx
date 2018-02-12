import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import Navigation from './components/navigation'
import routes from './routes'
import Head from './containers/Head'
import styles from './base.css'

class Layout extends Component {
    isActive = route => this.props.location.pathname === route.pathname

    render() {
        return (
            <div className={cx(styles.root, styles.sidebar)}>
                <Head />
                <Navigation
                    currentLocation={this.props.location}
                    routes={routes}
                />
                <div className={styles.route}>{this.props.children}</div>
            </div>
        )
    }
}

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired,
}

export default Layout
