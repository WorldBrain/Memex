import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import classNames from 'classnames'

import { OutLink } from 'src/common-ui/containers'
import styles from './styles.css'

const NavLink = ({ route, state, children }) => {
    const navClasses = classNames({
        [styles.navLink]: true,
        [styles.isActive]: children,
    })

    const navIcon = classNames({
        [styles.navIcon]: true,
        'material-icons': true,
    })

    const analysisCondition = classNames({
        [styles.active]: state.isIdle || state.isLoading,
        [styles.done]: state.isRunning || state.isStopped || state.isPaused,
    })

    const progressCondition = classNames({
        [styles.active]: state.isRunning || state.isPaused,
        [styles.done]: state.isStopped,
    })

    const badgeCondition = classNames({
        [styles.isNavActive]: children,
        [styles.badge]: state.unreadMessagesCount,
        [styles.loadbadge]: !state.unreadMessagesCount,
    })

    return (
        <li>
            <div className={navClasses}>
                <i className={navIcon}>{route.icon}</i>
                {route.component === 'faq' && (
                    <OutLink className={navClasses} href={route.pathname}>
                        {route.name}
                    </OutLink>
                )}
                {route.component !== 'faq' && (
                    <Link className={navClasses} to={route.pathname}>
                        {route.name}
                        {route.name === 'Notifications' && (
                            <div className={badgeCondition}>
                                {state.unreadMessagesCount}
                            </div>
                        )}
                    </Link>
                )}
            </div>
            {route.name === 'Import' &&
                children && (
                    <div className={styles.importSubItems}>
                        <div className={analysisCondition}>1. Analysis</div>
                        <div className={progressCondition}>
                            2. Download Progress
                        </div>
                        <div className={state.isStopped ? styles.active : null}>
                            3. Status Report
                        </div>
                    </div>
                )}
        </li>
    )
}

NavLink.propTypes = {
    route: PropTypes.object.isRequired,
    state: PropTypes.object.isRequired,
    children: PropTypes.bool.isRequired,
}

export default NavLink
