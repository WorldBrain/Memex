import React from 'react'
import PropTypes from 'prop-types'

import { ConfirmModal, ConfirmModalBtn } from 'src/common-ui/components'

const DeleteConfirmModal = ({ deleteDocs, ...modalProps }) => (
    <ConfirmModal {...modalProps} message="Are you sure you want to delete?">
        <ConfirmModalBtn onClick={deleteDocs}>
            Delete all associated data
        </ConfirmModalBtn>
    </ConfirmModal>
)

DeleteConfirmModal.propTypes = {
    deleteDocs: PropTypes.func.isRequired,
}

export default DeleteConfirmModal
