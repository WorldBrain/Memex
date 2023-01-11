import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import AccountInfo from 'src/authentication/components/AccountInfo'
import AuthDialog from 'src/authentication/components/AuthDialog'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { LOGIN_URL } from 'src/constants'
import { AuthContextInterface } from 'src/authentication/background/types'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import type { State, Event, Dependencies } from './types'
import { runInBackground } from 'src/util/webextensionRPC'
import { StatefulUIElement } from 'src/util/ui-logic'
import Logic from './logic'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'

// interface Props {
//     initiallyShowSubscriptionModal?: boolean
//     refreshUser?: boolean
//     showSubscriptionModal: () => void
// }

export interface Props extends Dependencies {
    refreshUser?: boolean
}

export default class UserScreen extends StatefulUIElement<Props, State, Event> {
    static defaultProps: Pick<Props, 'authBG'> = {
        authBG: runInBackground(),
    }

    async componentDidMount() {
        const user = await this.props.authBG.getCurrentUser()
        this.processEvent('getCurrentUser', { currentUser: user })
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    getTitle() {
        if (this.state.authDialogMode === 'login') {
            return 'Welcome Back'
        }

        if (this.state.authDialogMode === 'signup') {
            return 'Welcome to Memex'
        }

        if (this.state.authDialogMode === 'resetPassword') {
            return 'Reset your password'
        }

        if (this.state.authDialogMode === 'ConfirmResetPassword') {
            return 'Check your Emails'
        }
    }

    getDescription() {
        if (this.state.authDialogMode === 'login') {
            return 'Login to continue'
        }

        if (this.state.authDialogMode === 'signup') {
            return 'Welcome to Memex'
        }

        if (this.state.authDialogMode === 'resetPassword') {
            return 'Enter the email you used to sign up for Memex'
        }

        if (this.state.authDialogMode === 'ConfirmResetPassword') {
            return 'Check your Emails, and your Spam folder'
        }
    }

    getIcon() {
        if (this.state.authDialogMode === 'login') {
            return 'login'
        }

        if (this.state.authDialogMode === 'signup') {
            return 'peopleFine'
        }

        if (this.state.authDialogMode === 'resetPassword') {
            return 'reload'
        }

        if (this.state.authDialogMode === 'ConfirmResetPassword') {
            return 'mail'
        }
    }

    render() {
        return (
            <>
                {this.state.currentUser === null ? (
                    <div>
                        <SettingSection
                            icon={this.getIcon()}
                            title={this.getTitle()}
                            description={this.getDescription()}
                        >
                            <AuthDialog
                                onAuth={() => {
                                    window.location.reload()
                                }}
                                onModeChange={({ mode }) => {
                                    this.processEvent('setAuthDialogMode', {
                                        mode,
                                    })
                                }}
                            />
                        </SettingSection>
                    </div>
                ) : (
                    <AccountInfo
                        setAuthMode={(mode) => {
                            this.processEvent('setAuthDialogMode', {
                                mode: mode,
                            })
                        }}
                    />
                )}
            </>
        )
    }
}

const UserScreenContainer = styled.div`
    margin-bottom: 30px;
`

const Section = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 16px;
    font-weight: 300;
`
