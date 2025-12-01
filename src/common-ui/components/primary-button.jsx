import React from 'react'
import PropTypes from 'prop-types'
export function PrimaryButton(props) {
    return (
        <div
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
