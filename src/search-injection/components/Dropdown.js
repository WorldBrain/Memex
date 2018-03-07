import React from 'react'
import PropTypes from 'prop-types'

import styles from './Dropdown.css'

class Dropdown extends React.Component {
    static propTypes = {
        isMinimized: PropTypes.bool.isRequired,
        minimize: PropTypes.func.isRequired,
    }

    render() {
        return (
            <div className={styles.dropdownContainer}>
                <ul className={styles.dropdown}>
                    <li
                        className={styles.dropdownElement}
                        onClick={this.props.minimize}
                    >
                        {this.props.isMinimized ? 'Maximize' : 'Minimize'}
                    </li>
                    <li className={styles.dropdownElement}>
                        Remove Results Forever
                    </li>
                    <li className={styles.dropdownElement}>
                        Change position of Memex
                    </li>
                </ul>
            </div>
        )
    }
}

export default Dropdown
