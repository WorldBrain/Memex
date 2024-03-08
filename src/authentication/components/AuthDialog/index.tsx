import React from 'react'
import styled from 'styled-components'

import {
    AuthError,
    AuthProviderType,
} from '@worldbrain/memex-common/lib/authentication/types'
import SimpleTextInput from '@worldbrain/memex-common/lib/common-ui/components/simple-text-input'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { StatefulUIElement } from 'src/util/ui-logic'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'
import { runInBackground } from 'src/util/webextensionRPC'

import Logic from './logic'
import type { State, Event, Dependencies, AuthDialogMode } from './types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

export interface Props extends Dependencies {}

const FRIENDLY_ERRORS: { [Key in AuthError['reason']]: string } = {
    'popup-blocked': 'Could not open a popup for you to log in',
    'invalid-email': 'Please enter a valid e-mail address',
    'user-not-found': `There's nobody registered with that e-mail address`,
    'wrong-password': 'You entered a wrong password',
    'email-exists': `There's already an account with that e-mail address registered`,
    'weak-password': 'Please enter a stronger password',
    unknown: 'Sorry, something went wrong on our side. Please try again later',
}

export default class AuthDialog extends StatefulUIElement<Props, State, Event> {
    static defaultProps: Pick<Props, 'authBG'> = {
        authBG: runInBackground(),
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private checkPasswordMatch(value) {
        if (this.state.password === value) {
            this.processEvent('passwordMatch', { value: true })
        } else {
            this.processEvent('passwordMatch', { value: false })
        }
    }

    private checkBrowser() {
        let browserName = 'unknown'
        if (
            (navigator.userAgent.indexOf('Opera') ||
                navigator.userAgent.indexOf('OPR')) != -1
        ) {
            browserName = 'Opera'
        } else if (navigator.userAgent.indexOf('Chrome') != -1) {
            browserName = 'Chrome'
        } else if (navigator.userAgent.indexOf('Safari') != -1) {
            browserName = 'Safari'
        } else if (navigator.userAgent.indexOf('Firefox') != -1) {
            browserName = 'Firefox'
        }
        return browserName
    }

    renderAuthForm() {
        const showLoginButton =
            this.state.passwordMatch &&
            this.state.email.includes('@') &&
            this.state.email.includes('.') &&
            this.state.displayName.length >= 2 &&
            this.state.password.length > 0 &&
            this.state.passwordConfirm.length > 0

        if (this.state.mode === 'signup') {
            return (
                <StyledAuthDialog>
                    <AuthBox top="medium">
                        <AuthenticationMethods>
                            <EmailPasswordLogin>
                                {this.renderLoginTypeSwitcher()}
                                {this.checkBrowser() !== 'Firefox' && (
                                    <>
                                        <SocialLogins>
                                            <SocialLogin
                                                icon={'path to icon'}
                                                provider="google"
                                                onClick={() =>
                                                    this.processEvent(
                                                        'socialLogin',
                                                        {
                                                            provider: 'google',
                                                        },
                                                    )
                                                }
                                                mode={this.state.mode}
                                            />
                                            <SocialLogin
                                                icon={'path to icon'}
                                                provider="twitter"
                                                onClick={() =>
                                                    this.processEvent(
                                                        'socialLogin',
                                                        {
                                                            provider: 'twitter',
                                                        },
                                                    )
                                                }
                                                mode={this.state.mode}
                                            />
                                        </SocialLogins>
                                        <OrTitle>or</OrTitle>
                                    </>
                                )}
                                <TextInputContainer>
                                    <Icon
                                        filePath={icons.mail}
                                        heightAndWidth="20px"
                                        hoverOff
                                    />
                                    <TextInput
                                        type="email"
                                        placeholder="E-mail"
                                        value={this.state.email}
                                        onChange={(event) =>
                                            this.processEvent('editEmail', {
                                                value: event.target.value,
                                            })
                                        }
                                        onKeyDown={handleEnter(() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        })}
                                        autoFocus
                                    />
                                </TextInputContainer>
                                {this.state.email.length > 0 && (
                                    <>
                                        <TextInputContainer>
                                            <Icon
                                                filePath={icons.lock}
                                                heightAndWidth="20px"
                                                hoverOff
                                            />
                                            <TextInput
                                                type="password"
                                                placeholder="Password"
                                                value={this.state.password}
                                                onChange={(event) =>
                                                    this.processEvent(
                                                        'editPassword',
                                                        {
                                                            value:
                                                                event.target
                                                                    .value,
                                                        },
                                                    )
                                                }
                                                onKeyDown={handleEnter(() => {
                                                    this.processEvent(
                                                        'emailPasswordConfirm',
                                                        null,
                                                    )
                                                })}
                                            />
                                        </TextInputContainer>
                                        <TextInputContainer>
                                            <Icon
                                                filePath={icons.reload}
                                                heightAndWidth="20px"
                                                hoverOff
                                            />
                                            <TextInput
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={
                                                    this.state.passwordConfirm
                                                }
                                                onChange={(event) => {
                                                    this.processEvent(
                                                        'editPasswordConfirm',
                                                        {
                                                            value:
                                                                event.target
                                                                    .value,
                                                        },
                                                    )
                                                    this.checkPasswordMatch(
                                                        event.target.value,
                                                    )
                                                }}
                                                onKeyDown={handleEnter(() => {
                                                    this.processEvent(
                                                        'emailPasswordConfirm',
                                                        null,
                                                    )
                                                })}
                                            />
                                        </TextInputContainer>
                                        <DisplayNameContainer>
                                            <TextInputContainer>
                                                <Icon
                                                    filePath={icons.personFine}
                                                    heightAndWidth="20px"
                                                    hoverOff
                                                />
                                                <TextInput
                                                    type="input"
                                                    placeholder="Display Name"
                                                    value={
                                                        this.state.displayName
                                                    }
                                                    onChange={(event) =>
                                                        this.processEvent(
                                                            'editDisplayName',
                                                            {
                                                                value:
                                                                    event.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    onKeyDown={handleEnter(
                                                        () => {
                                                            this.processEvent(
                                                                'emailPasswordConfirm',
                                                                null,
                                                            )
                                                        },
                                                    )}
                                                />
                                            </TextInputContainer>
                                            <InfoText>
                                                Shown on shared Spaces,
                                                annotations & replies.
                                            </InfoText>
                                        </DisplayNameContainer>
                                    </>
                                )}
                                <ConfirmContainer>
                                    {showLoginButton && (
                                        <PrimaryAction
                                            onClick={() => {
                                                this.processEvent(
                                                    'emailPasswordConfirm',
                                                    null,
                                                )
                                            }}
                                            label={'Sign Up'}
                                            size={'large'}
                                            type={'primary'}
                                            fullWidth
                                            iconPosition="right"
                                            icon={'longArrowRight'}
                                        />
                                    )}
                                </ConfirmContainer>
                                {this.state.error && (
                                    <AuthErrorMessage>
                                        {this.renderAuthError()}
                                    </AuthErrorMessage>
                                )}
                            </EmailPasswordLogin>
                        </AuthenticationMethods>
                    </AuthBox>
                </StyledAuthDialog>
            )
        }
        if (this.state.mode === 'login') {
            return (
                <StyledAuthDialog>
                    <AuthBox top="medium">
                        <AuthenticationMethods>
                            <EmailPasswordLogin>
                                {this.renderLoginTypeSwitcher()}
                                {this.checkBrowser() !== 'Firefox' && (
                                    <>
                                        <SocialLogins>
                                            <SocialLogin
                                                icon={'path to icon'}
                                                provider="google"
                                                onClick={() =>
                                                    this.processEvent(
                                                        'socialLogin',
                                                        {
                                                            provider: 'google',
                                                        },
                                                    )
                                                }
                                                mode={this.state.mode}
                                            />
                                            <SocialLogin
                                                icon={'path to icon'}
                                                provider="twitter"
                                                onClick={() =>
                                                    this.processEvent(
                                                        'socialLogin',
                                                        {
                                                            provider: 'twitter',
                                                        },
                                                    )
                                                }
                                                mode={this.state.mode}
                                            />
                                        </SocialLogins>
                                        <OrTitle>or</OrTitle>
                                    </>
                                )}
                                <TextInputContainer>
                                    <Icon
                                        filePath={icons.mail}
                                        heightAndWidth="20px"
                                        hoverOff
                                    />
                                    <TextInput
                                        type="email"
                                        placeholder="E-mail"
                                        value={this.state.email}
                                        onChange={(e) =>
                                            this.processEvent('editEmail', {
                                                value: e.target.value,
                                            })
                                        }
                                        onKeyDown={handleEnter(() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        })}
                                    />
                                </TextInputContainer>
                                {this.state.email.length > 0 && (
                                    <>
                                        <TextInputContainer>
                                            <>
                                                <Icon
                                                    filePath={icons.lock}
                                                    heightAndWidth="20px"
                                                    hoverOff
                                                />
                                                <TextInput
                                                    type="password"
                                                    placeholder="Password"
                                                    value={this.state.password}
                                                    onChange={(e) =>
                                                        this.processEvent(
                                                            'editPassword',
                                                            {
                                                                value:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    onKeyDown={handleEnter(
                                                        () => {
                                                            this.processEvent(
                                                                'emailPasswordConfirm',
                                                                null,
                                                            )
                                                        },
                                                    )}
                                                />
                                            </>
                                            <ForgotPassword
                                                onClick={() => {
                                                    this.processEvent(
                                                        'passwordResetSwitch',
                                                        null,
                                                    )
                                                }}
                                            >
                                                Forgot Password?
                                            </ForgotPassword>
                                        </TextInputContainer>
                                    </>
                                )}
                                <ConfirmContainer>
                                    <PrimaryAction
                                        onClick={() =>
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        }
                                        disabled={
                                            !(
                                                this.state.password.length >
                                                    0 &&
                                                this.state.email.includes(
                                                    '@',
                                                ) &&
                                                this.state.email.includes('.')
                                            )
                                        }
                                        label={'Login'}
                                        size={'large'}
                                        type={'primary'}
                                        fullWidth
                                        icon={'longArrowRight'}
                                        iconPosition={'right'}
                                    />
                                </ConfirmContainer>
                                {this.state.error && (
                                    <AuthErrorMessage>
                                        {this.renderAuthError()}
                                    </AuthErrorMessage>
                                )}
                            </EmailPasswordLogin>
                        </AuthenticationMethods>
                    </AuthBox>
                </StyledAuthDialog>
            )
        }
        if (this.state.mode === 'resetPassword') {
            return (
                <StyledAuthDialog>
                    <AuthBox top="medium">
                        <AuthenticationMethods>
                            <EmailPasswordLogin>
                                <TextInputContainer>
                                    <Icon
                                        filePath={icons.mail}
                                        heightAndWidth="20px"
                                        hoverOff
                                    />
                                    <TextInput
                                        type="email"
                                        placeholder="E-mail"
                                        value={this.state.email}
                                        onChange={(e) =>
                                            this.processEvent('editEmail', {
                                                value: e.target.value,
                                            })
                                        }
                                        onKeyDown={handleEnter(() => {
                                            this.processEvent(
                                                'passwordReset',
                                                null,
                                            )
                                            this.processEvent(
                                                'passwordResetConfirm',
                                                null,
                                            )
                                        })}
                                    />
                                </TextInputContainer>
                                <ConfirmContainer>
                                    <PrimaryAction
                                        onClick={() => {
                                            this.processEvent(
                                                'passwordReset',
                                                null,
                                            )
                                            this.processEvent(
                                                'passwordResetConfirm',
                                                null,
                                            )
                                        }}
                                        disabled={
                                            !(
                                                this.state.email.includes(
                                                    '@',
                                                ) &&
                                                this.state.email.includes('.')
                                            )
                                        }
                                        label={'Send Reset Email'}
                                        fontSize={'16px'}
                                        fontColor={'black'}
                                        backgroundColor={'prime1'}
                                        icon={'longArrowRight'}
                                        iconSize={'22px'}
                                        iconPosition={'right'}
                                        type="primary"
                                        size="large"
                                        width="100%"
                                    />
                                    <Margin
                                        width={'100%'}
                                        height="10px"
                                        vertical="5px"
                                    />
                                    <PrimaryAction
                                        onClick={() => {
                                            this.processEvent('toggleMode', {
                                                mode: 'login',
                                            })
                                        }}
                                        label={'Go Back'}
                                        fontSize={'16px'}
                                        iconSize={'22px'}
                                        iconPosition={'right'}
                                        type="tertiary"
                                        size="large"
                                        width="100%"
                                    />
                                </ConfirmContainer>
                                {this.state.error && (
                                    <AuthErrorMessage>
                                        {this.renderAuthError()}
                                    </AuthErrorMessage>
                                )}
                                {this.renderLoginTypeSwitcher()}
                            </EmailPasswordLogin>
                        </AuthenticationMethods>
                    </AuthBox>
                </StyledAuthDialog>
            )
        }
        if (this.state.mode === 'ConfirmResetPassword') {
            return (
                <>
                    <PrimaryAction
                        label={'Back to Login'}
                        onClick={() =>
                            this.processEvent('toggleMode', { mode: 'login' })
                        }
                        size={'large'}
                        type={'primary'}
                    />
                </>
                // <StyledAuthDialog>
                //     <SectionContainer>
                //         <SectionCircle>
                //             <Icon
                //                 filePath={icons.mail}
                //                 heightAndWidth="34px"
                //                 color="prime1"
                //                 hoverOff
                //             />
                //         </SectionCircle>

                //         <SectionTitle>
                //             Password-Reset email sent
                //         </SectionTitle>
                //         <InfoTextBig>
                //             Check your email inbox. Emails may also land in your spamn folder.
                //         </InfoTextBig>
                //     </SectionContainer>
                // </StyledAuthDialog>
            )
        }
    }

    private renderLoginTypeSwitcher() {
        return (
            <Footer>
                {this.state.mode === 'login' && (
                    <InfoText>
                        Don’t have an account?{' '}
                        <ModeSwitch
                            onClick={() =>
                                this.processEvent('toggleMode', {
                                    mode: 'signup',
                                })
                            }
                        >
                            Sign up
                        </ModeSwitch>
                    </InfoText>
                )}
                {this.state.mode === 'signup' && (
                    <InfoText>
                        Already have an account?{' '}
                        <ModeSwitch
                            onClick={() =>
                                this.processEvent('toggleMode', {
                                    mode: 'login',
                                })
                            }
                        >
                            Log in
                        </ModeSwitch>
                    </InfoText>
                )}
            </Footer>
        )
    }

    renderAuthError() {
        const { state } = this

        const error = (text: string) => {
            return (
                <Margin vertical={'medium'}>
                    <EmailPasswordError>{text}</EmailPasswordError>
                </Margin>
            )
        }

        if (state.error) {
            return error(FRIENDLY_ERRORS[state.error])
        }

        if (state.saveState === 'error') {
            const action = state.mode === 'login' ? 'log you in' : 'sign you up'
            return error(
                `Something went wrong trying to ${action}. Please try again later.`,
            )
        }

        return null
    }

    render() {
        if (this.state.saveState === 'running') {
            return (
                <LoadingBox>
                    <LoadingIndicator />
                </LoadingBox>
            )
        } else {
            return <ContentBox>{this.renderAuthForm()}</ContentBox>
        }
    }
}

function SocialLogin(props: {
    icon: string
    provider: AuthProviderType
    onClick(event: { provider: AuthProviderType }): void
    mode: AuthDialogMode
}) {
    let modeName: string

    if (props.mode === 'login') {
        modeName = 'Login'
    } else if (props.mode === 'signup') {
        modeName = 'Sign up'
    } else {
        return null
    }

    let providerName: string

    if (props.provider === 'google') {
        providerName = 'Google'
    } else {
        providerName = 'Twitter'
    }

    return (
        <PrimaryAction
            onClick={() => props.onClick({ provider: props.provider })}
            label={`${modeName} with ${providerName}`}
            size="large"
            backgroundColor={
                props.provider === 'twitter' ? 'twitter' : undefined
            }
            type="secondary"
            icon={props.provider === 'google' ? 'googleLogo' : 'twitterLogo'}
            width="100%"
        />
    )
}

const LoadingBox = styled.div`
    height: 100px;
    width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
`

const AuthErrorMessage = styled.div`
    background-color: ${(props) => props.theme.colors.warning}10;
    font-size: 14px;
    padding-left: 10px;
    margin-top: 5px;
    color: ${(props) => props.theme.colors.warning};
    border: 1px solid ${(props) => props.theme.colors.warning};
    padding: 15px;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 350px;
`

const SectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    margin: 20px 0px;
    justify-content: center;
    align-items: center;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 60px;
    width: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 18px;
    font-weight: bold;
`

const InfoTextBig = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    font-weight: 400;
    text-align: center;
`

const ForgotPassword = styled.div`
    white-space: nowrap;
    color: ${(props) => props.theme.colors.prime1};
    cursor: pointer;
    font-weight: 500;
`

const DisplayNameContainer = styled.div`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    justify-content: flex-start;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    text-align: center;
    margin-top: 10px;
`

const FeatureInfoBox = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: row;
    justify-content: center;
    align-items: center;
`

const ConfirmContainer = styled.div`
    margin-top: 15px;

    & > * {
        transition: opacity 0.3s ease-in-out;
        opacity: 1;
    }
`
const TextInputContainer = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    background: ${(props) => props.theme.colors.greyScale1};
    height: 44px;
    border-radius: 8px;
    padding: 0 15px;
    width: 350px;
    &:focus-within {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    }
`

const TextInput = styled(SimpleTextInput)`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    font-weight: 300;
    border: none;
    background: transparent;

    &::placeholder {
        color: ${(props) => props.theme.colors.greyScale5};
    }
`

const WelcomeContainer = styled.div`
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    background-color: ${(props) => props.theme.colors.black};
`

const LeftSide = styled.div`
    width: 60%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background-color: ${(props) => props.theme.colors.black};

    @media (max-width: 1000px) {
        width: 100%;
    }
`

const LogoImg = styled.img`
    height: 50px;
    width: auto;
`

const ContentBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    max-width: 380px;
`

const Title = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 10px;
    margin-top: 30px;
`

const DescriptionText = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 18px;
    font-weight: normal;
    margin-bottom: 30px;
    text-align: center;
`

const RightSide = styled.div`
    width: 40%;
    background-image: url('img/onboardingBackground1.svg');
    height: 100vh;
    background-size: cover;
    background-repeat: no-repeat;
    display: grid;
    grid-auto-flow: row;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 100px 0 50px 0;
    overflow: hidden;

    @media (max-width: 1000px) {
        display: none;
    }
`

const CommentDemo = styled.img`
    height: 70%;
    width: auto;
    margin: auto;
`

const TitleSmall = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 22px;
    font-weight: 800;
    text-align: center;
`

const StyledAuthDialog = styled.div`
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`
const AuthenticationMethods = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  }
`
const EmailPasswordLogin = styled.div`
    display: grid;
    grid-auto-flow: row;
    grid-gap: 15px;
    justify-content: center;
    align-items: center;
`

const EmailPasswordError = styled.div`
    color: ${(props) => props.theme.colors.warning};
    text-align: center;
`

const AuthBox = styled(Margin)`
    display: flex;
    justify-content: center;
`

const Footer = styled.div`
    text-align: center;
    user-select: none;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    opacity: 0.8;
    margin-top: -10px;
    margin-bottom: 20px;
`
const ModeSwitch = styled.span`
    cursor: pointer;
    font-weight: bold;
    color: ${(props) => props.theme.colors.prime1};
    font-weight: 14px;
`

function handleEnter(f: () => void) {
    const handler = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.keyCode === 13) {
            f()
        }
    }
    return handler
}

const SocialLogins = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    grid-gap: 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.greyScale3};
`

const OrTitle = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    font-size: 20px;
    font-weight: 300;
    margin-bottom: 00px;
    margin-top: 00px;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    width: 100%;
`
