import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import Modal from './Modal'
import Spinner from './LoadingIndicator'
import styles from './ConfirmModal.css'

const ConfirmModal = ({
    message,
    isShown,
    children,
    onClose,
    isLoading = false,
}) =>
    isShown ? (
        <Modal onClose={onClose}>
            <div
                className={cx(styles.textContainer, {
                    [styles.textContainerLoading]: isLoading,
                })}
            >
                {message}
                <Spinner />
            </div>
            <div className={styles.btnBar}>{children}</div>
        </Modal>
    ) : null

ConfirmModal.propTypes = {
    isShown: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func,
    isLoading: PropTypes.bool,
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
}

export default ConfirmModal
