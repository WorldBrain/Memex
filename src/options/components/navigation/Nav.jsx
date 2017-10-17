import React from 'react'
import PropTypes from 'prop-types'

import styles from './styles.css'

const Nav = ({ children }) => {
    return (
        <nav className={styles.root}>
            <div className={styles.icon_div}>
                <img src="/img/worldbrain-logo.png" className={styles.icon} />
            </div>
            <ul className={styles.nav}>{children}</ul>
        </nav>
    )
}

Nav.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default Nav
