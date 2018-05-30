import React from 'react'
import PropTypes from 'prop-types'

import styles from './Dropdown.css'

const Dropdown = props => (
    <div className={styles.dropdown}>
        <div className={styles.dropdownTextAfter} />
        <div className={styles.dropdownText}>
            <form className={styles.searchContainer}>
                <input
                    onChange={props.onTagSearchChange}
                    onKeyDown={props.onTagSearchKeyDown}
                    ref={props.setInputRef}
                    value={props.tagSearchValue}
                    className={styles.search}
                    name="query"
                    placeholder="Search and add to lists"
                    autoComplete="off"
                    autoFocus
                />
                <i className="material-icons">search</i>
            </form>
            <div style={{ overflowY: 'auto', maxHeight: '240px' }}>
                {props.children}
            </div>
            <div>
                <span style={{ padding: '0 14px' }}>0 list(s) selected</span>
                <span className={styles.applyButton}>Apply</span>
            </div>
        </div>
    </div>
)

Dropdown.propTypes = {
    children: PropTypes.node.isRequired,
    onTagSearchChange: PropTypes.func.isRequired,
    onTagSearchKeyDown: PropTypes.func.isRequired,
    setInputRef: PropTypes.func.isRequired,
    tagSearchValue: PropTypes.string.isRequired,
}

export default Dropdown
