import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Navigation from './components/navigation'
import routes from './routes'

import styles from './base.css'

class Layout extends Component {
    isActive(route) {
        return this.props.location.pathname === route.pathname
    }

    render() {
        const { children, location } = this.props
        const currentRoute = routes.find(route => this.isActive(route))
        const hideSidebar = currentRoute.hideSidebar

        return (
            <div
                className={`${styles.root} ${hideSidebar
                    ? ''
                    : styles.sidebar}`}
            >
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

const mapStateToProps = state => ({})

const mapDispatchToProps = dispatch => ({})

export default connect(mapStateToProps, mapDispatchToProps)(Layout)
