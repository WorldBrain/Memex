import React from 'react'
import PropTypes from 'prop-types'
import styles from './Popup.css'
import localStyles from './TagOption.css'

const Tags = ({
    children,
    onTagSearchChange,
    setInputRef,
    numberOfTags,
    tagSearch,
}) => (
    <div>
        <form className={styles.searchContainer}>
            <input
                className={styles.search}
                name="query"
                placeholder="Search & Add Tag(s)"
                onChange={onTagSearchChange}
                ref={setInputRef}
                autoComplete="off"
                value={tagSearch}
            />
            <i className="material-icons">search</i>
        </form>
        <div className={localStyles.tagContainer}>{children}</div>
        <div className={localStyles.summaryTagContainer}>
            <div className={localStyles.numberTags}>
                {numberOfTags} tag selected
            </div>
        </div>
    </div>
)

Tags.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
    onTagSearchChange: PropTypes.func.isRequired,
    setInputRef: PropTypes.func.isRequired,
    numberOfTags: PropTypes.number.isRequired,
    tagSearch: PropTypes.string.isRequired,
}

export default Tags
