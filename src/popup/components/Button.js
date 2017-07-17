import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const Button = ({ icon, children, ...btnProps }) => (
    <button className={classNames(styles.item, styles.itemBtn)} {...btnProps}>
        <i className='material-icons'>{icon}</i>
        {children}
    </button>
)

Button.propTypes = {
    icon: PropTypes.string.isRequired,
    children: PropTypes.string.isRequired,
}

export default Button
