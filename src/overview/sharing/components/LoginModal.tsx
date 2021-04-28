import React from 'react'
import styled from 'styled-components'

import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import {
    SignInScreen,
    Props as SignInProps,
} from 'src/authentication/components/SignIn'
import { runInBackground } from 'src/util/webextensionRPC'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'

export interface Props
    extends Pick<
            ModalProps,
            'onClose' | 'requiresExplicitStyles' | 'ignoreReactPortal'
        >,
        Pick<SignInProps, 'onSuccess' | 'onFail' | 'redirectTo'> {
    contentScriptBG?: ContentScriptsInterface<'caller'>
    contentSharingBG?: ContentSharingInterface
    authBG?: AuthRemoteFunctionsInterface
    routeToLoginBtn?: boolean
}

export default class LoginModal extends React.PureComponent<Props> {
    static defaultProps: Pick<
        Props,
        'contentScriptBG' | 'contentSharingBG' | 'authBG'
    > = {
        contentSharingBG: runInBackground(),
        contentScriptBG: runInBackground(),
        authBG: runInBackground(),
    }

    private handleLoginSuccess = async () => {
        this.props.onSuccess?.()
        this.props.onClose?.({} as any)
        await this.props.authBG.refreshUserInfo()
        this.props.contentSharingBG.executePendingActions()
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
                        onSuccess={this.handleLoginSuccess}
                    />
                )}
            </Modal>
        )
    }
}

const TitleText = styled.div``

const AuthRouteLink = styled.button``
