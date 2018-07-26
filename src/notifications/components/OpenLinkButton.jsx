import React from 'react'
import PropTypes from 'prop-types'

import styles from './Notification.css'

const OpenLinkButton = props => (
    <a
        href={props.url}
        className={styles.button}
        target={props.context === 'new-tab' ? '_blank' : '_self'}
    >
        {props.label}
    </a>
)

OpenLinkButton.propTypes = {
    url: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    context: PropTypes.string,
}

export default OpenLinkButton
