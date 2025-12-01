import React from 'react'
import PropTypes from 'prop-types'

const Notification = (props) => {
    return (
        <div>
            <div>
                <div>{props.title}</div>
                <div>{props.message}</div>
            </div>
            <div>{props.button}</div>
            <div onClick={props.handleTick} title="Mark as read">
                Mark as Read
            </div>
        </div>
    )
}

Notification.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    handleTick: PropTypes.func.isRequired,
    button: PropTypes.node,
}

export default Notification
