import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Notification.css'

const openLinkButtonSearch = fromSearch =>
    classNames(styles.button, {
        [styles.searchButton]: fromSearch,
    })

const OpenLinkButton = props => (
    <a
        href={props.url}
        className={openLinkButtonSearch(props.fromSearch)}
        target={props.context === 'new-tab' ? '_blank' : '_self'}
    >
        {props.label}
    </a>
)

OpenLinkButton.propTypes = {
    url: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    context: PropTypes.string,
    fromSearch: PropTypes.string,
}

export default OpenLinkButton
