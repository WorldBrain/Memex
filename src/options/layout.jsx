import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import Navigation from './components/navigation'
import routes from './routes'
import Head from './containers/Head'
import styles from './base.css'
import LoginButton from '../overview/login-btn/LoginButton'
import { HelpBtn } from '../overview/help-btn'

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
                <LoginButton />
                <HelpBtn />
            </div>
        )
    }
}

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired,
}

export default Layout
