import React from 'react'
import PropTypes from 'prop-types'
import styles from './Popup.css'
import localStyles from './TagOption.css'

const Tags = ({
    children,
    onTagSearchChange,
    setInputRef,
    onTagSearchEnter,
    value,
    numberOfTags,
    handleClick,
}) => (
    <div>
        <form className={styles.searchContainer}>
            <input
                className={styles.search}
                name="query"
                placeholder="Search & Add Tag(s)"
                onChange={onTagSearchChange}
                onKeyDown={onTagSearchEnter}
                ref={setInputRef}
                value={value}
            />
            <i className="material-icons">search</i>
        </form>
        <div className={localStyles.tagContainer}>{children}</div>
        <div className={localStyles.summaryTagContainer}>
            <div className={localStyles.numberTags}>
                {numberOfTags} tag selected
            </div>
            <div className={localStyles.tagDone}>
                <button
                    className={localStyles.tagDoneButton}
                    onClick={() => handleClick()}
                >
                    Done
                </button>
            </div>
        </div>
    </div>
)

Tags.propTypes = {
    children: PropTypes.arrayOf(PropTypes.element).isRequired,
    onTagSearchChange: PropTypes.func.isRequired,
    setInputRef: PropTypes.func.isRequired,
    onTagSearchEnter: PropTypes.func.isRequired,
    value: PropTypes.string.isRequired,
    numberOfTags: PropTypes.number.isRequired,
    handleClick: PropTypes.func.isRequired,
}

export default Tags
