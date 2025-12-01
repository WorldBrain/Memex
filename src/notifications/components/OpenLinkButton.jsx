import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const OpenLinkButton = (props) => (
    <a
        href={props.url}
        target={props.context === 'new-tab' ? '_blank' : '_self'}
    >
        {props.label}
    </a>
)

OpenLinkButton.propTypes = {
    url: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    context: PropTypes.string,
    fromSearch: PropTypes.bool,
}

export default OpenLinkButton
