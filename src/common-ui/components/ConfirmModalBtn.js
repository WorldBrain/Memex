import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ConfirmModal.css'

const ConfirmModalBtn = ({
    disabled,
    children,
    cancel = false,
    ...btnProps
}) => (
    <a
        className={cx(styles.btn, styles.confirmBtn, {
            [styles.cancelBtn]: cancel,
            [styles.noButton]: disabled,
        })}
        data-annotation="sidebar"
        {...btnProps}
    >
        {children}
    </a>
)

ConfirmModalBtn.propTypes = {
    children: PropTypes.string.isRequired,
    cancel: PropTypes.bool,
    disabled: PropTypes.bool,
}

export default ConfirmModalBtn
