import React, { Component } from 'react'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'

export interface Props
    extends Pick<ModalProps, 'onClose' | 'requiresExplicitStyles'> {
    onClose: () => void
}

export default class ShareAnnotationModal extends Component<Props> {
    render() {
        return (
            <Modal {...this.props} large>
                Hello share annotation modal!
            </Modal>
        )
    }
}
