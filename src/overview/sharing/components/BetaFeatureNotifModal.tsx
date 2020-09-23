import React, { Component } from 'react'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import BetaFeatureNotif from './BetaFeatureNotif'

export interface Props
    extends Pick<
        ModalProps,
        'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
    > {
    showSubscriptionModal: () => void
    betaRequestStrategy?: 'go-to-options-page' | 'sign-in'
}

export default class BetaFeatureNotifModal extends Component<Props> {
    render() {
        const {
            showSubscriptionModal,
            betaRequestStrategy,
            ...props
        } = this.props

        return (
            <Modal large {...props}>
                <BetaFeatureNotif
                    showSubscriptionModal={showSubscriptionModal}
                    betaRequestStrategy={betaRequestStrategy}
                />
            </Modal>
        )
    }
}
