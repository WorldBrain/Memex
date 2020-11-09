import React, { PureComponent } from 'react'
import { ModalIds } from 'src/overview/modals/reducer'
import SubscribeModal from 'src/authentication/components/Subscription/SubscribeModal'
import ShareListModal from 'src/overview/sharing/components/ShareListModal'
import ShareAnnotationOnboardingModal from 'src/overview/sharing/components/ShareAnnotationOnboardingModal'
import BetaFeatureNotifModal from 'src/overview/sharing/components/BetaFeatureNotifModal'

export interface Props {
    modalId?: ModalIds
    modalOptions?: any
    onClose: () => any
}

const modalsMap: { [key in ModalIds]: (props: Props) => JSX.Element } = {
    Subscription: ({ modalOptions, onClose }) => (
        <SubscribeModal onClose={onClose} {...modalOptions} />
    ),
    ShareListModal: ({ modalOptions, onClose }) => (
        <ShareListModal onClose={onClose} {...modalOptions} />
    ),
    ShareAnnotationOnboardingModal: ({ modalOptions, onClose }) => (
        <ShareAnnotationOnboardingModal onClose={onClose} {...modalOptions} />
    ),
    BetaFeatureNotifModal: ({ modalOptions, onClose }) => (
        <BetaFeatureNotifModal
            onClose={() => {
                window.location.reload()
            }}
            {...modalOptions}
        />
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
