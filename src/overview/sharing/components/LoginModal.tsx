import React from 'react'
import styled from 'styled-components'

import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import {
    SignInScreen,
    Props as SignInProps,
} from 'src/authentication/components/SignIn'
import { runInBackground } from 'src/util/webextensionRPC'

export interface Props
    extends Pick<
            ModalProps,
            'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
        >,
        Pick<SignInProps, 'onSuccess' | 'onFail' | 'redirectTo'> {
    contentScriptBG?: ContentScriptsInterface<'caller'>
    routeToLoginBtn?: boolean
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
                <TitleText>
                    You need to be logged in to use sharing features
                </TitleText>
                {this.props.routeToLoginBtn ? (
                    <AuthRouteLink onClick={this.handleGoToClick}>
                        Go to Memex Login page >
                    </AuthRouteLink>
                ) : (
                    <SignInScreen
                        {...this.props}
                        onSuccess={() => {
                            this.props.onSuccess?.()
                            this.props.onClose?.({} as any)
                        }}
                    />
                )}
            </Modal>
        )
    }
}

const TitleText = styled.div``

const AuthRouteLink = styled.button``
