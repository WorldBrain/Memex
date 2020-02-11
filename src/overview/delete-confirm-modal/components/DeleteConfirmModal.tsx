import React, { PureComponent } from 'react'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

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
            <ConfirmModal {...modalProps} message={this.props.message}>
                <PrimaryAction label="Delete" onClick={deleteDocs}/>
            </ConfirmModal>
        )
    }
}

export default DeleteConfirmModal
