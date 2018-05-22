import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const Button = ({ children, btnClass, itemClass, ...btnProps }) => (
    <button
        className={classNames(styles.item, styles.itemBtn, itemClass)}
        {...btnProps}
    >
        <div className={classNames(styles.customIcon, btnClass)} />
        {children}
    </button>
)

Button.propTypes = {
    children: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
        .isRequired,
    btnClass: PropTypes.string,
    itemClass: PropTypes.string,
}

export default Button
