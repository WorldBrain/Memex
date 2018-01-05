import React from 'react'
import PropTypes from 'prop-types'
import styles from './Popup.css'
import localStyles from './TagOption.css'

const Tags = ({ children, onTagSearchChange }) => (
    <div>
        <form className={styles.searchContainer}>
            <input
                className={styles.search}
                name="query"
                placeholder="Search & Add Tag(s)"
                onChange={onTagSearchChange}
            />
            <i className="material-icons">search</i>
        </form>
        <div className={localStyles.tagContainer}>{children}</div>
    </div>
)

Tags.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
    onTagSearchChange: PropTypes.func.isRequired,
}

export default Tags
