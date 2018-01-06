import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'

const Tags = ({
    children,
    onTagSearchChange,
    setInputRef,
    onTagSearchEnter,
    numberOfTags,
    handleClick,
}) => (
    <div className={localStyles.tagDiv}>
        <form className={localStyles.searchContainer}>
            <input
                className={localStyles.search}
                name="query"
                placeholder="Search & Add Tag(s)"
                onChange={onTagSearchChange}
                onKeyDown={onTagSearchEnter}
                ref={setInputRef}
                autoComplete="off"
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
                    onClick={() => handleClick('')}
                >
                    Done
                </button>
            </div>
        </div>
    </div>
)

Tags.propTypes = {
    children: PropTypes.object.isRequired,
    onTagSearchChange: PropTypes.func.isRequired,
    setInputRef: PropTypes.func.isRequired,
    onTagSearchEnter: PropTypes.func.isRequired,
    numberOfTags: PropTypes.number.isRequired,
    handleClick: PropTypes.func.isRequired,
}

export default Tags
