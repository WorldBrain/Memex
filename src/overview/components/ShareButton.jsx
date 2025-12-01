import React from 'react'
import PropTypes from 'prop-types'

import OutLink from 'src/common-ui/containers/OutLink'

const ShareButton = ({ imgSrc, children, href, ...anchorProps }) => (
    <OutLink to={href} {...anchorProps}>
        {imgSrc ? <img vspace={2} src={imgSrc} /> : children}
    </OutLink>
)

ShareButton.propTypes = {
    imgSrc: PropTypes.string,
    children: PropTypes.string,
    href: PropTypes.string,
}

export default ShareButton
