import React from 'react'
import styled from 'styled-components'

import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import { runInBackground } from 'src/util/webextensionRPC'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import Button from '@worldbrain/memex-common/lib/common-ui/components/button'
import DisplayNameSetup from './DisplayNameSetup'

export interface Props
    extends Pick<
        ModalProps,
        'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
    > {
    contentScriptBG?: ContentScriptsInterface<'caller'>
    authBG?: AuthRemoteFunctionsInterface
    routeToLoginBtn?: boolean
}

export default class DisplayNameModal extends React.PureComponent<Props> {
    static defaultProps: Pick<Props, 'contentScriptBG' | 'authBG'> = {
        contentScriptBG: runInBackground(),
        authBG: runInBackground(),
    }

    private handleGoToClick = () => {
        this.props.contentScriptBG.openAuthSettings()
    }

    render() {
        return (
            <Modal {...this.props}>
                <TitleText>
                    Please set a display name then share again
                </TitleText>
                {this.props.routeToLoginBtn ? (
                    <>
                        <Margin />
                        <Button
                            type="primary-action"
                            onClick={this.handleGoToClick}
                        >
                            Next
                        </Button>
                    </>
                ) : (
                    <DisplayNameSetup
                        authBG={this.props.authBG}
                        onSaveComplete={this.props.onClose}
                    />
                )}
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
