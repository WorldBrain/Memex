import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'
import classNames from 'classnames'

const getTagsClass = overview =>
    classNames(localStyles.tagDiv, {
        [localStyles.tagDivFromOverview]: overview,
    })

const getSearchContainerClass = overview =>
    classNames(localStyles.searchContainer, {
        [localStyles.searchContainerOverview]: overview,
    })

const getSearchClass = overview =>
    classNames(localStyles.search, {
        [localStyles.searchOverview]: overview,
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
        <form className={getSearchContainerClass(overview)}>
            <input
                className={getSearchClass(overview)}
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
