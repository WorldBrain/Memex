import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { Modal } from 'src/common-ui/components'
import styles from './DeleteConfirmation.css'

const DeleteConfirmation = ({ isShown, close, deleteDocs }) => isShown
    ? <Modal onClose={close}>
        Are you sure you want to delete?

        <div className={styles.buttonBar}>
            <button className={cx([styles.button, styles.confirmButton])} onClick={deleteDocs}>
                Delete all associated data
            </button>
        </div>
    </Modal>
    : null

DeleteConfirmation.propTypes = {
    isShown: PropTypes.bool.isRequired,
    close: PropTypes.func.isRequired,
    deleteDocs: PropTypes.func.isRequired,
}

export default DeleteConfirmation
