import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './Button.css'

const getButtonClass = buttonType =>
    classNames(styles.button, {
        [styles.settingsIcon]: buttonType,
    })

const ButtonIcon = ({ icon, buttonType, btnClass, ...btnProps }) => (
    <a
        className={getButtonClass(buttonType)}
        target="_blank"
        tabIndex="-1"
        {...btnProps}
    >
        <div
            className={classNames(
                styles.customIcon,
                styles.buttonIcons,
                btnClass,
            )}
        />
    </a>
)

ButtonIcon.propTypes = {
    icon: PropTypes.string,
    buttonType: PropTypes.number,
    btnClass: PropTypes.string,
}

export default ButtonIcon
