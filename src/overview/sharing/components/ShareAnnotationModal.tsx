import React, { Component } from 'react'

import { Modal } from 'src/common-ui/components'

export interface Props {
    onClose: () => void
}

export default class ShareAnnotationModal extends Component<Props> {
    render() {
        return (
            <Modal large onClose={this.props.onClose}>
                Hello share annotation modal!
            </Modal>
        )
    }
}
