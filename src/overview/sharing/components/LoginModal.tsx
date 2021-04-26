import React from 'react'
import styled from 'styled-components'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import {
    SignInScreen,
    Props as SignInProps,
} from 'src/authentication/components/SignIn'

export interface Props
    extends Pick<
            ModalProps,
            'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
        >,
        Pick<SignInProps, 'onFail' | 'redirectTo'> {}

export default class LoginModal extends React.PureComponent<Props> {
    render() {
        return (
            <Modal large {...this.props}>
                <TitleText>You've been logged out</TitleText>
                <SignInScreen
                    {...this.props}
                    onSuccess={() => this.props.onClose({} as any)}
                />
            </Modal>
        )
    }
}

const TitleText = styled.div``
