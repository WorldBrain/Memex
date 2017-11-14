import React from 'react'
import PropTypes from 'prop-types'

import { ConfirmModal, ConfirmModalBtn } from 'src/common-ui/components'

const BlacklistRemoveModal = ({
    onCancel,
    onConfirm,
    isRemoving,
    ...modalProps
}) => (
    <ConfirmModal
        {...modalProps}
        message="Do you want to delete all matching data for this entry?"
        isLoading={isRemoving}
    >
        <ConfirmModalBtn disabled={isRemoving} cancel onClick={onCancel}>
            No
        </ConfirmModalBtn>
        <ConfirmModalBtn disabled={isRemoving} onClick={onConfirm}>
            Yes
        </ConfirmModalBtn>
    </ConfirmModal>
)

BlacklistRemoveModal.propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isRemoving: PropTypes.bool.isRequired,
}

export default BlacklistRemoveModal
