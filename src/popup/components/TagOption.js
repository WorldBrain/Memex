import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'

const TagOption = ({
    data,
    active,
    handleClick,
    newTag,
    addTagsToReverseDoc,
}) => (
    <div
        className={localStyles.menuItem}
        onClick={() => (newTag ? addTagsToReverseDoc(data) : handleClick(data))}
    >
        {newTag === 1 ? 'add new: ' + data : data}
        {active && <i className="material-icons">done</i>}
    </div>
)

TagOption.propTypes = {
    data: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    handleClick: PropTypes.func.isRequired,
    newTag: PropTypes.number.isRequired,
    addTagsToReverseDoc: PropTypes.func.isRequired,
}

export default TagOption
