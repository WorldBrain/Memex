import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import styles from './primary-button.css'

export function PrimaryButton(props) {
    return (
        <div
            className={classNames(
                styles.primaryBtn,
                props.disabled && styles.disabled,
            )}
            onClick={() => {
                !props.disabled && props.onClick()
            }}
        >
            {props.children}
        </div>
    )
}

PrimaryButton.propTypes = {
    children: PropTypes.node,
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
}
