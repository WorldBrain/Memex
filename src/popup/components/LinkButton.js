import React from 'react'
import PropTypes from 'prop-types'

import { OutLink } from 'src/common-ui/containers'
import Button from './Button'
import styles from './Button.css'

const LinkButton = ({ href, ...btnProps }) => (
    <OutLink className={styles.link} to={href} tabIndex="-1">
        <Button {...btnProps} />
    </OutLink>
)

LinkButton.propTypes = {
    href: PropTypes.string.isRequired,
}

export default LinkButton
