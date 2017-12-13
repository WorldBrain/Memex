import React from 'react'
import PropTypes from 'prop-types'

import analytics from 'src/analytics'
import Button from './Button'

import styles from './Button.css'

const trackLinkClick = name => () =>
    analytics.trackEvent({
        category: 'Popup',
        action: 'Popup link click',
        name,
    })

const LinkButton = ({ href, ...btnProps }) => (
    <a
        className={styles.link}
        onClick={trackLinkClick(href)}
        href={href}
        target="_blank"
        tabIndex="-1"
    >
        <Button {...btnProps} />
    </a>
)

LinkButton.propTypes = {
    href: PropTypes.string.isRequired,
}

export default LinkButton
