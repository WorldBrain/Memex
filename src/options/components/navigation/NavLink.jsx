import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import classNames from 'classnames'
import styles from './styles.css'

const NavLink = ({ route, currentLocation, state, idx }) => {
    console.log(state)
    const navClasses = classNames({
        [styles.navLink]: true,
        [styles.isActive]: isActive(route),
    })

    const navIcon = classNames({
        [styles.navIcon]: true,
        'material-icons': true,
    })

    function isActive(route) {
        return currentLocation.pathname === route.pathname
    }

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
                        <div
                            className={
                                state.isIdle || state.isLoading
                                    ? styles.active
                                    : state.isRunning ||
                                      !(state.isIdle || state.isLoading)
                                      ? styles.done
                                      : null
                            }
                        >
                            1. Analysis
                        </div>
                        <div
                            className={
                                state.isRunning
                                    ? styles.active
                                    : !(state.isIdle || state.isLoading)
                                      ? styles.done
                                      : null
                            }
                        >
                            2. Download Progress
                        </div>
                        <div
                            className={
                                !(state.isIdle || state.isLoading)
                                    ? styles.active
                                    : null
                            }
                        >
                            3. Status Report
                        </div>
                    </div>
                )}
        </li>
    )
}

NavLink.propTypes = {
    route: PropTypes.object.isRequired,
    currentLocation: PropTypes.object.isRequired,
    idx: PropTypes.number.isRequired,
    state: PropTypes.object.isRequired,
}

export default NavLink
