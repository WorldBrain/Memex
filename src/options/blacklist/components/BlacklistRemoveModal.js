import React from 'react'
import PropTypes from 'prop-types'

import { ConfirmModal, ConfirmModalBtn } from 'src/common-ui/components'

const DeleteConfirmModal = ({ onCancel, onConfirm, ...modalProps }) => (
    <ConfirmModal
        {...modalProps}
        message="Do you want to delete all matching data for this entry?"
    >
        <ConfirmModalBtn cancel onClick={onCancel}>
            No
        </ConfirmModalBtn>
        <ConfirmModalBtn onClick={onConfirm}>Yes</ConfirmModalBtn>
    </ConfirmModal>
)

DeleteConfirmModal.propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}

export default DeleteConfirmModal
