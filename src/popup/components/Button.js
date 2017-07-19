import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const Button = ({ icon, children, btnClass, ...btnProps }) => (
    <button className={classNames(styles.item, styles.itemBtn, btnClass)} {...btnProps}>
        {icon && <i className='material-icons'>{icon}</i>}
        {children}
    </button>
)

Button.propTypes = {
    icon: PropTypes.string,
    children: PropTypes.string.isRequired,
    btnClass: PropTypes.string,
}

export default Button
