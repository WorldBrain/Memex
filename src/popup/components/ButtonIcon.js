import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const getButtonClass = buttonType =>
    classNames(styles.button, {
        [styles.settings]: buttonType,
    })

const getIconClass = classNames({
    [styles.icon]: true,
    'material-icons': true,
})

const ButtonIcon = ({ icon, buttonType, ...btnProps }) => (
    <a
        className={getButtonClass(buttonType)}
        target="_blank"
        tabIndex="-1"
        {...btnProps}
    >
        {icon && <i className={getIconClass}>{icon}</i>}
    </a>
)

ButtonIcon.propTypes = {
    icon: PropTypes.string,
    buttonType: PropTypes.number,
}

export default ButtonIcon
