import React from 'react'
import PropTypes from 'prop-types'

import { ConfirmModal, ConfirmModalBtn } from 'src/common-ui/components'

const renderMsg = ({ isLoading, matchedCount }) =>
    isLoading
        ? 'Calculating matching data...'
        : `Do you want to schedule ${matchedCount} matching data for background deletion?`

const BlacklistRemoveModal = ({ onCancel, onConfirm, ...modalProps }) => (
    <ConfirmModal {...modalProps} message={renderMsg(modalProps)}>
        <ConfirmModalBtn
            disabled={modalProps.isLoading}
            cancel
            onClick={onCancel}
        >
            No
        </ConfirmModalBtn>
        <ConfirmModalBtn disabled={modalProps.isLoading} onClick={onConfirm}>
            Yes
        </ConfirmModalBtn>
    </ConfirmModal>
)

BlacklistRemoveModal.propTypes = {
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    matchedCount: PropTypes.number.isRequired,
}

export default BlacklistRemoveModal
