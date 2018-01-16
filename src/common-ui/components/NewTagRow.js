import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Tags.css'

const NewTagRow = ({ onClick, value }) => (
    <div className={localStyles.menuItem} onClick={onClick}>
        <span className={localStyles.bold}>add new: </span> {value}
    </div>
)

NewTagRow.propTypes = {
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
}

export default NewTagRow
