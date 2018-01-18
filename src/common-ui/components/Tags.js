import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './Tags.css'

const getTagsClass = overview =>
    classNames(localStyles.tagDiv, {
        [localStyles.tagDivFromOverview]: overview,
    })

const Tags = ({
    children,
    onTagSearchChange,
    onTagSearchKeyDown,
    numberOfTags,
    setTagDivRef,
    setInputRef,
    tagSearchValue,
    overview = false,
}) => (
    <div className={getTagsClass(overview)} ref={setTagDivRef}>
        <form className={localStyles.searchContainer}>
            <input
                className={localStyles.search}
                name="query"
                placeholder="Search & Add Tag(s)"
                onChange={onTagSearchChange}
                onKeyDown={onTagSearchKeyDown}
                ref={setInputRef}
                autoComplete="off"
                value={tagSearchValue}
                autoFocus
            />
            <i className="material-icons">search</i>
        </form>
        <div className={localStyles.tagContainer}>{children}</div>
        <div className={localStyles.summaryTagContainer}>
            <div className={localStyles.numberTags}>
                <span className={localStyles.bold}>{numberOfTags}</span> tags
                selected
            </div>
        </div>
    </div>
)

Tags.propTypes = {
    children: PropTypes.array.isRequired,
    onTagSearchChange: PropTypes.func.isRequired,
    onTagSearchKeyDown: PropTypes.func.isRequired,
    numberOfTags: PropTypes.number.isRequired,
    setTagDivRef: PropTypes.func,
    setInputRef: PropTypes.func.isRequired,
    tagSearchValue: PropTypes.string.isRequired,
    overview: PropTypes.bool,
}

export default Tags
