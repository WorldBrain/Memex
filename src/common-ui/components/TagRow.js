import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Tags.css'

const handleKeyDown = cb => event => {
    if (event.key === 'Enter') {
        cb(event)
    }
}

const TagRow = ({ value, active, onClick }) => (
    <div
        tabIndex={0}
        className={localStyles.menuItem}
        onClick={onClick}
        onKeyDown={handleKeyDown(onClick)}
    >
        {value}
        {active && <i className="material-icons">done</i>}
    </div>
)

TagRow.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.element])
        .isRequired,
    active: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
}

export default TagRow
