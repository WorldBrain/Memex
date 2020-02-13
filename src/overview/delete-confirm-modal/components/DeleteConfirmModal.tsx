import React, { PureComponent } from 'react'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

import { ConfirmModal, ConfirmModalProps } from '../../../common-ui/components'

export interface Props extends ConfirmModalProps {
    deleteDocs: () => Promise<void>
}

class DeleteConfirmModal extends PureComponent<Props> {
    private _action: React.RefObject<HTMLButtonElement>

    constructor(props) {
        super(props)
        this._action = React.createRef()
    }

    componentDidUpdate(prevProps, prevState) {
        if (this._action.current) {
            this._action.current.focus()
        }
    }

    render() {
        const { deleteDocs, ...modalProps } = this.props

        return (
            <ConfirmModal {...modalProps} message={this.props.message}>
                <PrimaryAction
                    label="Delete"
                    onClick={deleteDocs}
                    innerRef={this._action}
                />
            </ConfirmModal>
        )
    }
}

export default DeleteConfirmModal
