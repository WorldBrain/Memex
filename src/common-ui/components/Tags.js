import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'

const Tags = ({
    children,
    onTagSearchChange,
    numberOfTags,
    setTagDivRef,
    setTagInputRef,
    tagSearchValue,
}) => (
    <div className={localStyles.tagDiv} ref={setTagDivRef}>
        <form className={localStyles.searchContainer}>
            <input
                className={localStyles.search}
                name="query"
                placeholder="Search & Add Tag(s)"
                onChange={onTagSearchChange}
                ref={setTagInputRef}
                autoComplete="off"
                value={tagSearchValue}
                autoFocus
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
    children: PropTypes.object.isRequired,
    onTagSearchChange: PropTypes.func.isRequired,
    numberOfTags: PropTypes.number.isRequired,
    setTagDivRef: PropTypes.func.isRequired,
    setTagInputRef: PropTypes.func.isRequired,
    tagSearchValue: PropTypes.string.isRequired,
}

export default Tags
