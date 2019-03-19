import React, { PureComponent } from 'react'

import {
    ConfirmModal,
    ConfirmModalProps,
    ConfirmModalBtn,
} from '../../../common-ui/components'

export interface Props extends ConfirmModalProps {
    deleteDocs: () => Promise<void>
}

class DeleteConfirmModal extends PureComponent<Props> {
    render() {
        const { deleteDocs, ...modalProps } = this.props

        return (
            <ConfirmModal {...modalProps} message="Delete page and related notes">
                <ConfirmModalBtn onClick={deleteDocs}>Do it!</ConfirmModalBtn>
            </ConfirmModal>
        )
    }
}

export default DeleteConfirmModal
