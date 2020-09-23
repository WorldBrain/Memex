import React, { Component } from 'react'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import BetaFeatureNotif, {
    Props as BetaFeatureNotifProps,
} from './BetaFeatureNotif'

export interface Props
    extends BetaFeatureNotifProps,
        Pick<
            ModalProps,
            'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
        > {}

export default class BetaFeatureNotifModal extends Component<Props> {
    render() {
        return (
            <Modal large {...this.props}>
                <BetaFeatureNotif {...this.props} />
            </Modal>
        )
    }
}
