import React from 'react'
import PropTypes from 'prop-types'

import Button from './Button'

const LinkButton = ({ href, ...props }) => (
    <a className='popup-link' href={href} target='_blank'>
        <Button {...props} />
    </a>
)

LinkButton.propTypes = {
    href: PropTypes.string.isRequired,
}

export default LinkButton
