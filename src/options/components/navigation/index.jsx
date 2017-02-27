import React, { PropTypes } from 'react'
import { Link } from 'react-router'
import classNames from 'classnames'

import styles from './styles.css'

const Navigation = ({ currentLocation, routes }) => {
    function buildRoutes() {
        return routes.map((route, idx) => {
            let navClasses = classNames({
                [styles.navLink]: true,
                [styles.isActive]: isActive(route)
            })

            return (
                <li className={styles.navItem} key={idx}>
                    <Link className={navClasses} to={route.pathname}>{route.name}</Link>
                </li>
            )
        })
    }

    function isActive(route) {
        return currentLocation.pathname === route.pathname
    }

    return (
        <nav className={styles.root}>
            <h1 className={styles.title}>Web Memex</h1>
            
            <ul className={styles.nav}>
                { buildRoutes() }
            </ul>
        </nav>
    )
}

Navigation.propTypes = {
    currentLocation: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired
}

export default Navigation
