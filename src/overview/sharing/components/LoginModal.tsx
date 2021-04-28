import React from 'react'
import styled from 'styled-components'

import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import Modal, { Props as ModalProps } from 'src/common-ui/components/Modal'
import {
    SignInScreen,
    Props as SignInProps,
} from 'src/authentication/components/SignIn'
import styles, { fonts } from 'src/dashboard-refactor/styles'
import { runInBackground } from 'src/util/webextensionRPC'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import Button from '@worldbrain/memex-common/lib/common-ui/components/button'

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
                <TitleText>
                    Login or Sign Up
                </TitleText>
                {this.props.routeToLoginBtn ? (
                    <>
                        <Margin/>
                        <Button
                            type="primary-action"
                            onClick={() => this.handleGoToClick()}
                        >
                            Next
                        </Button>
                    </>
                ) : (
                    <>
                        <SubTitleText>
                            To sign up enter a new email address
                        </SubTitleText>
                        <SignInScreen
                            {...this.props}
                            onSuccess={this.handleLoginSuccess}
                        />
                    </>
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

    padding-bottom: ${(props) => props.routeToLoginBtn ? '20px' : '0px'}
`

const SubTitleText = styled.div`
    font-family: ${(props) => props.theme.fonts.primary};
    color: ${(props) => props.theme.colors.darkGrey};
    font-size: 14px;
    padding-bottom: 20px;
`

const Margin = styled.div`
    height: 20px;
`
