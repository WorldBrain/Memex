import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Tags.css'

const handleKeyDown = cb => event => {
    if (event.key === 'Enter') {
        cb(event)
    }
}

const NewTagRow = ({ onClick, value }) => (
    <div
        tabIndex={0}
        className={localStyles.menuItem}
        onClick={onClick}
        onKeyDown={handleKeyDown(onClick)}
    >
        <span className={localStyles.bold}>add new: </span> {value}
    </div>
)

NewTagRow.propTypes = {
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
}

export default NewTagRow
