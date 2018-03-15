import React from 'react'
import PropTypes from 'prop-types'

import styles from './Dropdown.css'

const openSettings = () => {
    const message = {
        action: 'openOptionsURL',
        url: 'settings',
    }
    browser.runtime.sendMessage(message)
}

const Dropdown = props => {
    return (
        <div className={styles.dropdownContainer}>
            <ul className={styles.dropdown}>
                <li className={styles.dropdownElement} onClick={openSettings}>
                    Settings
                </li>
                <li className={styles.dropdownElement} onClick={props.remove}>
                    Remove Results Forever
                </li>
                <li className={styles.dropdownElement} onClick={props.rerender}>
                    Change position of Memex
                </li>
            </ul>
        </div>
    )
}

Dropdown.propTypes = {
    remove: PropTypes.func.isRequired,
    rerender: PropTypes.func.isRequired,
}

export default Dropdown
