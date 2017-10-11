import React from 'react'
import PropTypes from 'prop-types'
import Navigation from './components/navigation'
import Routes from './routes'

import styles from './base.css'

const Layout = ({ children, location }) => (
    <div className={styles.root}>
        <Navigation currentLocation={location} routes={Routes} />
        <div className={styles.route}>{children}</div>
    </div>
)

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired,
}

export default Layout
