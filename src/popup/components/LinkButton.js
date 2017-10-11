import React from 'react'
import PropTypes from 'prop-types'

import Button from './Button'

import styles from './Button.css'

const LinkButton = ({ href, ...btnProps }) => (
    <a className={styles.link} href={href} target="_blank" tabIndex="-1">
        <Button {...btnProps} />
    </a>
)

LinkButton.propTypes = {
    href: PropTypes.string.isRequired,
}

export default LinkButton
