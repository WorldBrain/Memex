import React from 'react'
import PropTypes from 'prop-types'

import styles from './Dropdown.css'

const Dropdown = props => {
    return (
        <div className={styles.dropdownContainer}>
            <ul className={styles.dropdown}>
                <li className={styles.dropdownElement} onClick={props.minimize}>
                    {props.isMinimized ? 'Maximize' : 'Minimize'}
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
    isMinimized: PropTypes.bool.isRequired,
    minimize: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    rerender: PropTypes.func.isRequired,
}

export default Dropdown
