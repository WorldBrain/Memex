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
                <TitleText>Who is sharing?</TitleText>
                <SubTitleText>
                    Set a display name so people know who the content is from
                </SubTitleText>
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
    margin-bottom: 10px;
`

const SubTitleText = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.darkgrey};
    font-size: 16px;
    font-weight: 400;
`

const Margin = styled.div`
    height: 20px;
`
