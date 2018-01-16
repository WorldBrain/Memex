import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Tags.css'

const TagRow = ({ value, active, onClick }) => (
    <div className={localStyles.menuItem} onClick={onClick}>
        {value}
        {active && <i className="material-icons">done</i>}
    </div>
)

TagRow.propTypes = {
    value: PropTypes.string.isRequired,
    active: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
}

export default TagRow
