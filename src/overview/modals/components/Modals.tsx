import React, { PureComponent } from 'react'
import { ModalIds } from 'src/overview/modals/reducer'
import SubscribeModal from 'src/authentication/components/Subscription/SubscribeModal'
import ShareListModal from 'src/overview/sharing/components/ShareListModal'

export interface Props {
    modalId?: ModalIds
    modalOptions?: any
    onClose: () => any
}

const modalsMap = {
    Subscription: ({ modalOptions, onClose }) => (
        <SubscribeModal onClose={onClose} {...modalOptions} />
    ),
    ShareListModal: ({ modalOptions, onClose }) => (
        <ShareListModal onClose={onClose} {...modalOptions} />
    ),
}

class Modals extends PureComponent<Props> {
    constructor(props) {
        super(props)
    }

    render() {
        if (!this.props.modalId) {
            return null
        }

        return modalsMap[this.props.modalId]({
            modalOptions: this.props.modalOptions,
            onClose: this.props.onClose,
        })
    }
}

export default Modals
