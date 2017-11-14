import React from 'react'
import PropTypes from 'prop-types'

import Modal from './Modal'
import styles from './ConfirmModal.css'

const ConfirmModal = ({ message, isShown, children, onClose }) =>
    isShown ? (
        <Modal onClose={onClose}>
            {message}
            <div className={styles.btnBar}>{children}</div>
        </Modal>
    ) : null

ConfirmModal.propTypes = {
    isShown: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
}

export default ConfirmModal
