import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const Button = ({ children, btnClass, ...btnProps }) => (
    <button
        className={classNames(styles.item, styles.itemBtn, btnClass)}
        {...btnProps}
    >
        <div className={classNames(styles.customIcon, btnClass)} />
        {children}
    </button>
)

Button.propTypes = {
    children: PropTypes.string.isRequired,
    btnClass: PropTypes.string,
}

export default Button
