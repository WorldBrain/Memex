import React from 'react'
import PropTypes from 'prop-types'

const StatusHeading = ({ children }) => <div>{children}</div>

StatusHeading.propTypes = {
    children: PropTypes.string.isRequired,
}

export default StatusHeading
