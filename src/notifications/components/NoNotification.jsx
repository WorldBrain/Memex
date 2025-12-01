import React from 'react'
import PropTypes from 'prop-types'

const NoNotification = ({ title, children }) => (
    <div>
        <div>{title}</div>
        <div>{children}</div>
    </div>
)

NoNotification.propTypes = {
    title: PropTypes.string,
    children: PropTypes.string.isRequired,
}

export default NoNotification
