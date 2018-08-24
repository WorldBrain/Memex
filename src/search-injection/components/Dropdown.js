import React from 'react'
import PropTypes from 'prop-types'
import onClickOutside from 'react-onclickoutside'

import { remoteFunction } from 'src/util/webextensionRPC'
import styles from './Dropdown.css'

class Dropdown extends React.Component {
    static propTypes = {
        remove: PropTypes.func.isRequired,
        rerender: PropTypes.func.isRequired,
        closeDropdown: PropTypes.func.isRequired,
    }

    openOptionsRPC = remoteFunction('openOptionsTab')

    openSettings = () => this.openOptionsRPC('settings')

    handleClickOutside = () => {
        this.props.closeDropdown()
    }

    render() {
        return (
            <div className={styles.dropdownContainer}>
                <ul className={styles.dropdown}>
                    <li
                        className={styles.dropdownElement}
                        onClick={this.openSettings}
                    >
                        Settings
                    </li>
                    <li
                        className={styles.dropdownElement}
                        onClick={this.props.rerender}
                    >
                        Change position of Memex
                    </li>
                    <li
                        className={styles.dropdownElement}
                        onClick={this.props.remove}
                    >
                        Remove Results Forever
                    </li>
                </ul>
            </div>
        )
    }
}

export default onClickOutside(Dropdown)
