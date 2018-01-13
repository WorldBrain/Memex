import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './TagOption.css'
import classNames from 'classnames'

const getOptionClass = hovered =>
    classNames(localStyles.menuItem, {
        [localStyles.hoveredMenuItem]: hovered,
    })

const NewTagMsg = ({ data, handleClick, hovered }) => (
    <div
        className={getOptionClass(hovered)}
        onClick={() => {
            handleClick(data)
        }}
    >
        <span className={localStyles.bold}>add new: </span> {data}
    </div>
)

NewTagMsg.propTypes = {
    data: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
    hovered: PropTypes.bool.isRequired,
}

export default NewTagMsg
