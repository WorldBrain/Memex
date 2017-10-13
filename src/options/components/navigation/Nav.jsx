import React from 'react'
import PropTypes from 'prop-types'

import styles from './styles.css'

import NavLink from './NavLink'

const Nav = ({ routes, currentLocation, state }) => {
    function buildRoutes() {
        return routes.map((route, idx) => {
            return (
                <NavLink
                    route={route}
                    key={idx}
                    currentLocation={currentLocation}
                    state={state}
                />
            )
        })
    }

    return (
        <nav className={styles.root}>
            <div className={styles.icon_div}>
                <img src="/img/worldbrain-logo.png" className={styles.icon} />
            </div>
            <ul className={styles.nav}>{buildRoutes()}</ul>
        </nav>
    )
}

Nav.propTypes = {
    routes: PropTypes.array.isRequired,
    currentLocation: PropTypes.object.isRequired,
    state: PropTypes.object.isRequired,
}

export default Nav
