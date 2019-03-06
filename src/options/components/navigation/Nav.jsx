import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'

import styles from './styles.css'

const Nav = ({ children }) => {
    return (
        <nav className={styles.root}>
            <ul className={styles.nav}>{children}</ul>
            <div className={styles.icon_div}>
                <Link to="/overview">
                    <img
                        src="/img/worldbrain-logo.png"
                        className={styles.icon}
                    />
                </Link>
            </div>
        </nav>
    )
}

Nav.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default Nav
