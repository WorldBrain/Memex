import React from 'react'
import PropTypes from 'prop-types'

const NotificationList = ({ children }) => <ul>{children}</ul>

NotificationList.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
}

export default NotificationList
