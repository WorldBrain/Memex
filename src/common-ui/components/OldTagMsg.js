import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './TagOption.css'

const getOptionClass = hovered =>
    classNames(localStyles.menuItem, {
        [localStyles.hoveredMenuItem]: hovered,
    })

const OldTagMsg = ({ value, active, onClick, hovered }) => (
    <div className={getOptionClass(hovered)} onClick={onClick}>
        {value}
        {active && <i className="material-icons">done</i>}
    </div>
)

OldTagMsg.propTypes = {
    value: PropTypes.string.isRequired,
    active: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    hovered: PropTypes.bool.isRequired,
}

export default OldTagMsg
