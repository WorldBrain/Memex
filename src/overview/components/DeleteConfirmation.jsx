import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './DeleteConfirmation.css'

const confirmBtnStyles = classNames(styles.confirm, styles.button, styles.confirmButton)
const getOverlayStyles = isShown => classNames({
    [styles.overlay]: true,
    [styles.overlayShown]: isShown,
})

const DeleteConfirmation = ({ isShown, close, deleteDocs }) => (
    <div className={getOverlayStyles(isShown)}>
        <div className={styles.popup}>
            <button className={classNames(styles.close, styles.button)} onClick={close}>×</button>
            <div className={styles.content}>
                Are you sure you want to delete?

                <div className={styles.buttonBar}>
                    <button className={confirmBtnStyles} onClick={deleteDocs}>
                        Delete all associated data
                    </button>
                </div>
            </div>
        </div>
    </div>
)

DeleteConfirmation.propTypes = {
    isShown: PropTypes.bool.isRequired,
    close: PropTypes.func.isRequired,
    deleteDocs: PropTypes.func.isRequired,
}

export default DeleteConfirmation
