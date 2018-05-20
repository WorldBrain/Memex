import React from 'react'
import PropTypes from 'prop-types'

import { ConfirmModal, ConfirmModalBtn } from 'src/common-ui/components'

const DeleteConfirmModal = ({ deleteList, ...modalProps }) => (
    <ConfirmModal {...modalProps} message="Sure you wanna delete that?">
        <ConfirmModalBtn onClick={deleteList}>Do it!</ConfirmModalBtn>
    </ConfirmModal>
)

DeleteConfirmModal.propTypes = {
    deleteList: PropTypes.func.isRequired,
}

export default DeleteConfirmModal
