import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'
import classNames from 'classnames'

const getTagsClass = fromOverview =>
    classNames(localStyles.tagDiv, {
        [localStyles.tagDivFromOverview]: fromOverview,
    })

const getSearchContainerClass = fromOverview =>
    classNames(localStyles.searchContainer, {
        [localStyles.searchContainerOverview]: fromOverview,
    })

const getSearchClass = fromOverview =>
    classNames(localStyles.search, {
        [localStyles.searchOverview]: fromOverview,
    })

const Tags = ({
    children,
    onTagSearchChange,
    numberOfTags,
    setTagDivRef,
    setInputRef,
    tagSearch,
    fromOverview,
    keydown,
}) => (
    <div
        className={getTagsClass(fromOverview)}
        ref={setTagDivRef}
        onKeyDown={keydown}
    >
        <form className={getSearchContainerClass(fromOverview)}>
            <input
                className={getSearchClass(fromOverview)}
                name="query"
                placeholder="Search & Add Tag(s)"
                onChange={onTagSearchChange}
                ref={setInputRef}
                autoComplete="off"
                value={tagSearch}
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
    children: PropTypes.object.isRequired,
    onTagSearchChange: PropTypes.func.isRequired,
    numberOfTags: PropTypes.number.isRequired,
    setTagDivRef: PropTypes.func,
    setInputRef: PropTypes.func.isRequired,
    tagSearch: PropTypes.string.isRequired,
    fromOverview: PropTypes.number.isRequired,
    keydown: PropTypes.func,
}

export default Tags
