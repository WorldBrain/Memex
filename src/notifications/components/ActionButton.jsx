import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './ActionButton.css'

const actionButton = fromSearch =>
    classNames(styles.actionButton, {
        [styles.searchActionButton]: fromSearch,
    })

const ActionButton = props => (
    <button
        className={actionButton(props.fromSearch)}
        onClick={props.handleClick}
    >
        {props.children}
    </button>
)

ActionButton.propTypes = {
    children: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
    fromSearch: PropTypes.bool,
}

export default ActionButton
