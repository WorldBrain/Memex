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
import AuthDialog from 'src/authentication/components/AuthDialog'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

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

    private handleGoToClick = () => {
        this.props.contentScriptBG.openAuthSettings()
    }

    render() {
        return (
            <Modal {...this.props}>
                {this.props.routeToLoginBtn ? (
                    <>
                        <TitleText>Login or Sign up to Share</TitleText>
                        <PrimaryAction
                            onClick={this.handleGoToClick}
                            label={'Next'}
                        />
                    </>
                ) : (
                    <>
                        <TitleText>Login or Sign up to Share</TitleText>
                        <AuthDialog onAuth={() => this.handleLoginSuccess()} />
                    </>
                )}
            </Modal>
        )
    }
}

const TitleText = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 20px;
    font-weight: bold;

    padding-bottom: 30px;
`
