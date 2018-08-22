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
            <ConfirmModal {...modalProps} message="Sure you wanna delete that?">
                <ConfirmModalBtn onClick={deleteDocs}>Do it!</ConfirmModalBtn>
            </ConfirmModal>
        )
    }
}

export default DeleteConfirmModal
