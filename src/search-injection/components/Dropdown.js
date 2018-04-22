import React from 'react'
import PropTypes from 'prop-types'

import { OPEN_OPTIONS } from '../constants'
import styles from './Dropdown.css'

const openSettings = () => {
    const message = {
        action: OPEN_OPTIONS,
        query: 'settings',
    }
    browser.runtime.sendMessage(message)
}

class Dropdown extends React.Component {
    static propTypes = {
        remove: PropTypes.func.isRequired,
        rerender: PropTypes.func.isRequired,
        closeDropdown: PropTypes.func.isRequired,
    }

    componentDidMount() {
        document.addEventListener('click', this.handleOutsideClick)
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleOutsideClick)
    }

    handleOutsideClick = e => {
        if (this.dropdownRef && !this.dropdownRef.contains(e.target))
            this.props.closeDropdown()
    }

    setDropdownRef = node => {
        this.dropdownRef = node
    }

    render() {
        return (
            <div ref={this.setDropdownRef} className={styles.dropdownContainer}>
                <ul className={styles.dropdown}>
                    <li
                        className={styles.dropdownElement}
                        onClick={openSettings}
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

export default Dropdown
