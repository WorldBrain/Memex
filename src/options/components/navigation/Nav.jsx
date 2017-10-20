import React from 'react'
import PropTypes from 'prop-types'

import styles from './styles.css'
import * as constants from '../../../popup/constants'

const Nav = ({ children }) => {
    return (
        <nav className={styles.root}>
            <div className={styles.icon_div}>
                <a href={`${constants.OVERVIEW_URL}#/overview`}>
                    <img
                        src="/img/worldbrain-logo.png"
                        className={styles.icon}
                    />
                </a>
            </div>
            <ul className={styles.nav}>{children}</ul>
        </nav>
    )
}

Nav.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default Nav
