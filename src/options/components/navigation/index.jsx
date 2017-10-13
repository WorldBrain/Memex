import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import classNames from 'classnames'

import styles from './styles.css'

const Navigation = ({ currentLocation, routes }) => {
    function buildRoutes() {
        return routes.map((route, idx) => {
            const navClasses = classNames({
                [styles.navLink]: true,
                [styles.isActive]: isActive(route),
            })

            const navIcon = classNames({
                [styles.navIcon]: true,
                'material-icons': true,
            })

            return (
                <li>
                    <li className={navClasses} key={idx}>
                        <i className={navIcon}>{route.icon}</i>
                        {route.component === 'faq' && (
                            <a
                                className={navClasses}
                                href={route.pathname}
                                target="_blank"
                            >
                                {route.name}
                            </a>
                        )}
                        {route.component !== 'faq' && (
                            <Link className={navClasses} to={route.pathname}>
                                {route.name}
                            </Link>
                        )}
                    </li>
                    {route.name === 'Import' &&
                        isActive(route) && (
                            <div className={styles.importSubItems}>
                                <div className={styles.active}>1. Analysis</div>
                                <div>2. Download Progress</div>
                                <div>3. Status Report</div>
                            </div>
                        )}
                </li>
            )
        })
    }

    function isActive(route) {
        return currentLocation.pathname === route.pathname
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

Navigation.propTypes = {
    currentLocation: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
}

export default Navigation
