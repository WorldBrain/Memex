import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { OutLink } from 'src/common-ui/containers'
import styles from './Button.css'

const getButtonClass = buttonType =>
    classNames(styles.button, {
        [styles.settingsIcon]: buttonType,
    })

const ButtonIcon = ({
    icon,
    buttonType,
    btnClass,
    href,
    value,
    isNotif,
    ...btnProps
}) => (
    <OutLink
        className={getButtonClass(buttonType)}
        tabIndex="-1"
        to={href}
        {...btnProps}
    >
        <div
            className={classNames(
                styles.customIcon,
                styles.buttonIcons,
                btnClass,
            )}
        />
        {isNotif &&
            value !== 0 && (
                <div className={styles.notificationBadge}>{value}</div>
            )}
    </OutLink>
)

ButtonIcon.propTypes = {
    icon: PropTypes.string,
    buttonType: PropTypes.number,
    btnClass: PropTypes.string,
    href: PropTypes.string,
    value: PropTypes.number,
    isNotif: PropTypes.bool,
}

export default ButtonIcon
