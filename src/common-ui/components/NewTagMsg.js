import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './TagOption.css'

const getOptionClass = hovered =>
    classNames(localStyles.menuItem, {
        [localStyles.hoveredMenuItem]: hovered,
    })

const NewTagMsg = ({ onClick, hovered = false, value }) => (
    <div className={getOptionClass(hovered)} onClick={onClick}>
        <span className={localStyles.bold}>add new: </span> {value}
    </div>
)

NewTagMsg.propTypes = {
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    hovered: PropTypes.bool,
}

export default NewTagMsg
