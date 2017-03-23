import React, { PropTypes } from 'react'
import Navigation from './navigation'
import Routes from '../routes'

import styles from '../options.css'

const Layout = ({ location, children }) => (
    <div className={styles.root}>
        <Navigation currentLocation={location} routes={Routes} />
        <div className={styles.route}>
            {children}
        </div>
    </div>
)

Layout.propTypes = {
    location: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired
}

export default Layout
