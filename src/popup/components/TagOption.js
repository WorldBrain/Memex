import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'

const TagOption = ({ data, active, handleClick, tagSearchValue }) => (
    <div className={localStyles.menuItem} onClick={() => handleClick(data)}>
        {tagSearchValue === data ? 'add new: ' + data : data}
        {active && <i className="material-icons">done</i>}
    </div>
)

TagOption.propTypes = {
    data: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    handleClick: PropTypes.func.isRequired,
    tagSearchValue: PropTypes.string.isRequired,
}

export default TagOption
