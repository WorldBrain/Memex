import React from 'react'
import PropTypes from 'prop-types'

const TagOption = ({ children }) => <div>{children}</div>

TagOption.propTypes = {
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
        .isRequired,
}

export default TagOption
