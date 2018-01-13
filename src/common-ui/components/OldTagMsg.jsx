import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'
import classNames from 'classnames'

const getOptionClass = hovered =>
    classNames(localStyles.menuItem, {
        [localStyles.hoveredMenuItem]: hovered,
    })

const OldTagMsg = ({ data, active, handleClick, hovered }) => (
    <div
        className={getOptionClass(hovered)}
        onClick={() => {
            handleClick(data)
        }}
    >
        {data}
        {active && <i className="material-icons">done</i>}
    </div>
)

OldTagMsg.propTypes = {
    data: PropTypes.string.isRequired,
    active: PropTypes.bool,
    handleClick: PropTypes.func.isRequired,
    hovered: PropTypes.bool.isRequired,
}

export default OldTagMsg
