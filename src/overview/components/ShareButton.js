import React from 'react'
import PropTypes from 'prop-types'

import analytics from 'src/util/analytics'
import styles from './ShareButtons.css'

const trackLinkClick = name => () =>
    analytics.trackEvent({
        category: 'Overview',
        action: 'Share button click',
        name,
    })

const ShareButton = ({ className, href, imgSrc, children }) => (
    <a
        className={className}
        onClick={trackLinkClick(href)}
        target="_blank"
        href={href}
    >
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
