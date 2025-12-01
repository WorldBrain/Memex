import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const ActionButton = (props) => (
    <button onClick={props.handleClick}>{props.children}</button>
)

ActionButton.propTypes = {
    children: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
    fromSearch: PropTypes.bool,
}

export default ActionButton
