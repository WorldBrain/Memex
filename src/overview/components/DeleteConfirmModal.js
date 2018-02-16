import React from 'react'
import PropTypes from 'prop-types'

import { ConfirmModal, ConfirmModalBtn } from 'src/common-ui/components'

const DeleteConfirmModal = ({ deleteDocs, ...modalProps }) => (
    <ConfirmModal {...modalProps} message="Sure you wanna delete that?">
        <ConfirmModalBtn onClick={deleteDocs}>Do it!</ConfirmModalBtn>
    </ConfirmModal>
)

DeleteConfirmModal.propTypes = {
    deleteDocs: PropTypes.func.isRequired,
}

export default DeleteConfirmModal
