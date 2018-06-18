import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './AddListDropdown.css'

const AddListDropdown = props => (
    <div
        className={cx({
            [styles.dropdown]: props.overviewMode,
            [styles.popup]: !props.overviewMode,
        })}
    >
        {props.overviewMode && <div className={styles.dropdownTextAfter} />}
        <div className={styles.dropdownText}>
            <form className={styles.searchContainer}>
                <input
                    onChange={props.onListSearchChange}
                    onKeyDown={props.onListSearchKeyDown}
                    ref={props.setInputRef}
                    value={props.listSearchValue}
                    className={styles.search}
                    name="query"
                    placeholder="Search and add to lists"
                    autoComplete="off"
                    autoFocus
                />
                <i className="material-icons">search</i>
            </form>
            <div className={styles.dropdownBody}>{props.children}</div>
            <div className={styles.dropdownFooter}>
                <span>0 list(s) selected</span>
                <span
                    onClick={props.applyBulkEdits}
                    className={cx(styles.applyButton, {
                        [styles.applyButtonPopup]: !props.overviewMode,
                    })}
                >
                    {props.overviewMode ? 'Apply' : 'Set Quick-Add Default'}
                </span>
            </div>
        </div>
    </div>
)

AddListDropdown.propTypes = {
    children: PropTypes.node.isRequired,
    onListSearchChange: PropTypes.func.isRequired,
    onListSearchKeyDown: PropTypes.func.isRequired,
    setInputRef: PropTypes.func.isRequired,
    listSearchValue: PropTypes.string,
    applyBulkEdits: PropTypes.func,
    overviewMode: PropTypes.bool.isRequired,
}

export default AddListDropdown
