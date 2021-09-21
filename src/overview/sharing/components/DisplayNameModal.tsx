import React from 'react'
import styled from 'styled-components'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import { runInBackground } from 'src/util/webextensionRPC'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import DisplayNameSetup from './DisplayNameSetup'

export interface Props
    extends Pick<
        ModalProps,
        'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
    > {
    authBG?: AuthRemoteFunctionsInterface
}

export default class DisplayNameModal extends React.PureComponent<Props> {
    static defaultProps: Pick<Props, 'authBG'> = {
        authBG: runInBackground(),
    }

    render() {
        return (
            <Modal {...this.props}>
                <TitleText>Please set a display name before sharing</TitleText>
                <Margin />
                <DisplayNameSetup
                    authBG={this.props.authBG}
                    onSaveComplete={this.props.onClose}
                />
            </Modal>
        )
    }
}

const TitleText = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.primary};
    font-size: 18px;
    font-weight: 600;

    padding-bottom: ${(props) => (props.routeToLoginBtn ? '20px' : '0px')};
`

const Margin = styled.div`
    height: 20px;
`
