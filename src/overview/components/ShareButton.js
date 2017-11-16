import React from 'react'
import PropTypes from 'prop-types'

import styles from './ShareButtons.css'

const ShareButton = ({ className, href, imgSrc, children }) => (
    <a className={className} target="_blank" href={href}>
        {imgSrc ? (
            <img className={styles.shareImg} vspace={2} src={imgSrc} />
        ) : (
            children
        )}
    </a>
)

ShareButton.propTypes = {
    className: PropTypes.string,
    imgSrc: PropTypes.string,
    children: PropTypes.string,
    href: PropTypes.string.isRequired,
}

export default ShareButton
