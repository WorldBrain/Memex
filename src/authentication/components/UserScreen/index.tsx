import * as React from 'react'
import 'firebase/auth'
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
import { auth } from 'firebase-admin'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

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

    render() {
        return (
            <>
                {this.state.currentUser === null ? (
                    <div>
                        <Section>
                            {this.state.authDialogMode === 'login' && (
                                <UserScreenContainer>
                                    <SectionCircle>
                                        <Icon
                                            filePath={icons.login}
                                            heightAndWidth="24px"
                                            color="purple"
                                            hoverOff
                                        />
                                    </SectionCircle>
                                    <SectionTitle>Welcome Back!</SectionTitle>
                                    <InfoText>Login to continue</InfoText>
                                </UserScreenContainer>
                            )}
                            {this.state.authDialogMode === 'signup' && (
                                <UserScreenContainer>
                                    <SectionCircle>
                                        <Icon
                                            filePath={icons.peoplePlusFine}
                                            heightAndWidth="24px"
                                            color="purple"
                                            hoverOff
                                        />
                                    </SectionCircle>
                                    <SectionTitle>
                                        Welcome to Memex{' '}
                                    </SectionTitle>
                                    <InfoText>
                                        Create an account to get started
                                    </InfoText>
                                </UserScreenContainer>
                            )}
                            {this.state.authDialogMode === 'resetPassword' && (
                                <UserScreenContainer>
                                    <SectionCircle>
                                        <Icon
                                            filePath={icons.reload}
                                            heightAndWidth="24px"
                                            color="purple"
                                            hoverOff
                                        />
                                    </SectionCircle>
                                    <SectionTitle>
                                        Reset your password
                                    </SectionTitle>
                                    <InfoText></InfoText>
                                </UserScreenContainer>
                            )}
                            {this.state.authDialogMode ===
                                'ConfirmResetPassword' && (
                                <UserScreenContainer>
                                    <SectionCircle>
                                        <Icon
                                            filePath={icons.mail}
                                            heightAndWidth="24px"
                                            color="purple"
                                            hoverOff
                                        />
                                    </SectionCircle>
                                    <SectionTitle>
                                        Check your Emails
                                    </SectionTitle>
                                    <InfoText>
                                        Don't forget the spam folder!
                                    </InfoText>
                                </UserScreenContainer>
                            )}
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
                        </Section>
                    </div>
                ) : this.state.authDialogMode === 'ConfirmResetPassword' ? (
                    <Section>
                        <UserScreenContainer>
                            <SectionCircle>
                                <Icon
                                    filePath={icons.mail}
                                    heightAndWidth="24px"
                                    color="purple"
                                    hoverOff
                                />
                            </SectionCircle>
                            <SectionTitle>Check your Emails</SectionTitle>
                            <InfoText>Don't forget the spam folder!</InfoText>
                        </UserScreenContainer>
                        <PrimaryAction
                            label={'Go Back'}
                            onClick={() => {
                                this.processEvent('setAuthDialogMode', {
                                    mode: 'login',
                                })
                            }}
                        />
                    </Section>
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
    background: #ffffff;
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
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 16px;
    font-weight: 400;
`
