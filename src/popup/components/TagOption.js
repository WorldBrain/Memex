import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'
import classNames from 'classnames'

const getOptionClass = hovered =>
    classNames(localStyles.menuItem, {
        [localStyles.hoveredMenuItem]: hovered,
    })

const TagOption = ({
    data,
    active,
    handleClick,
    newTag,
    addTagsToReverseDoc,
    hover,
}) => (
    <div
        className={getOptionClass(hover)}
        onClick={() => (newTag ? addTagsToReverseDoc(data) : handleClick(data))}
    >
        {newTag === 1 ? (
            <div>
                <span className={localStyles.bold}>add new: </span> {data}
            </div>
        ) : (
            data
        )}
        {active && <i className="material-icons">done</i>}
    </div>
)

TagOption.propTypes = {
    data: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    handleClick: PropTypes.func.isRequired,
    newTag: PropTypes.number.isRequired,
    addTagsToReverseDoc: PropTypes.func.isRequired,
    hover: PropTypes.bool.isRequired,
}

export default TagOption
