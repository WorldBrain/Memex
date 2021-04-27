import React from 'react'
import styled from 'styled-components'

import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import { runInBackground } from 'src/util/webextensionRPC'

export interface Props
    extends Pick<
        ModalProps,
        'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
    > {
    contentScriptBG?: ContentScriptsInterface<'caller'>
}

export default class LoginModal extends React.PureComponent<Props> {
    static defaultProps: Pick<Props, 'contentScriptBG'> = {
        contentScriptBG: runInBackground(),
    }

    private handleGoToClick: React.MouseEventHandler = (e) => {
        this.props.contentScriptBG.openAuthSettings()
    }

    render() {
        return (
            <Modal {...this.props}>
                <TitleText>You've been logged out</TitleText>
                <AuthRouteLink onClick={this.handleGoToClick}>
                    Go to Memex Login page >
                </AuthRouteLink>
            </Modal>
        )
    }
}

const TitleText = styled.div``
const AuthRouteLink = styled.button``
