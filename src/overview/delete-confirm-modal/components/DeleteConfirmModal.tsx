import React, { PureComponent } from 'react'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import * as icons from 'src/common-ui/components/design-library/icons'
import ConfirmModal, {
    Props as ConfirmModalProps,
} from 'src/common-ui/components/ConfirmModal'

export interface Props extends ConfirmModalProps {
    deleteDocs: () => Promise<void>
    submessage?: string
}

class DeleteConfirmModal extends PureComponent<Props> {
    private _action: React.RefObject<HTMLDivElement>

    constructor(props) {
        super(props)
        this._action = React.createRef<HTMLDivElement>()
    }

    componentDidMount() {
        this._action.current.focus()
        this._action.current.addEventListener(
            'keydown',
            this.handleConfirmEvent,
        )
    }

    componentWillUnmount() {
        this._action.current.removeEventListener(
            'keydown',
            this.handleConfirmEvent,
        )
    }

    handleConfirmEvent = (event) => {
        if (event.key === 'Enter') {
            this.props.deleteDocs()
            this.props.onClose()
        }
        if (event.key === 'Escape') {
            this.props.onClose()
        }
    }

    render() {
        const { deleteDocs, ...modalProps } = this.props

        return (
            <ConfirmModal
                {...modalProps}
                message={this.props.message}
                submessage={this.props.submessage}
                type={'alert'}
                icon={icons.trash}
            >
                <PrimaryAction
                    label="Delete"
                    onClick={deleteDocs}
                    innerRef={this._action}
                    type={'secondary'}
                    size={'large'}
                    bold
                    tabIndex={-1}
                />
            </ConfirmModal>
        )
    }
}

export default DeleteConfirmModal
