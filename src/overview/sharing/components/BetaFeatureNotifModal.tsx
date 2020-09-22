import React, { Component } from 'react'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import BetaFeatureNotif from './BetaFeatureNotif'

export interface Props
    extends Pick<
        ModalProps,
        'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
    > {
    showSubscriptionModal: () => void
}

export default class BetaFeatureNotifModal extends Component<Props> {
    render() {
        const { showSubscriptionModal, ...props } = this.props

        return (
            <Modal large {...props}>
                <BetaFeatureNotif
                    showSubscriptionModal={showSubscriptionModal}
                />
            </Modal>
        )
    }
}
