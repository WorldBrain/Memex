import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ConfirmModal.css'

const ConfirmModalBtn = ({ children, cancel = false, ...btnProps }) => (
    <button
        className={cx(styles.btn, styles.confirmBtn, {
            [styles.cancelBtn]: cancel,
        })}
        {...btnProps}
    >
        {children}
    </button>
)

ConfirmModalBtn.propTypes = {
    children: PropTypes.string.isRequired,
    cancel: PropTypes.bool,
}

export default ConfirmModalBtn
