import React from 'react'
import styled, { keyframes } from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import Logic from './logic'
import type { State, Event, Dependencies } from './types'
import OnboardingBox from '../../components/onboarding-box'
import { OVERVIEW_URL } from 'src/constants'
import Margin from 'src/dashboard-refactor/components/Margin'

import AuthDialog from 'src/authentication/components/AuthDialog/index'

import { runInBackground } from 'src/util/webextensionRPC'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { GUIDED_ONBOARDING_URL } from '../../constants'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

const styles = require('../../components/onboarding-box.css')

export interface Props extends Dependencies {}

export default class OnboardingScreen extends StatefulUIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<
        Props,
        | 'navToDashboard'
        | 'authBG'
        | 'personalCloudBG'
        | 'navToGuidedTutorial'
        | 'contentScriptsBG'
    > = {
        authBG: runInBackground(),
        personalCloudBG: runInBackground(),
        contentScriptsBG: runInBackground(),
        navToDashboard: () => {
            window.location.href = OVERVIEW_URL
            window.location.reload()
        },
        navToGuidedTutorial: () => {
            window.open(GUIDED_ONBOARDING_URL)
        },
    }

    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private renderInfoSide = () => {
        return (
            <RightSide>
                <CommentDemo src={'img/welcomeScreenIllustration.svg'} />
            </RightSide>
        )
    }

    private renderLoginStep = () => (
        <WelcomeContainer>
            {!this.state.twitterSignupComplete ? (
                <TwitterOnboardingContainer>
                    <TwitterImage />
                    <TwitterOnboardingContent>
                        <Icon
                            icon="twitter"
                            heightAndWidth="45px"
                            color="secondary"
                        />
                        <TwitterOnboardingContentBox>
                            <Title fontSize={'45px'}>
                                Catching the birds...
                            </Title>
                            <TwitterOnboardingSubtext>
                                We’re analyzing the tweets of the people you
                                follow on Twitter.
                                <br /> This may take a few hours and will
                                complete in the background.
                                <br />
                                <br />
                                Now we’re loading the first tweet to show you
                                how that looks like in action.
                            </TwitterOnboardingSubtext>
                            <PrimaryAction
                                type="secondary"
                                size="large"
                                label={
                                    <TwitterOnboardingButtonContent>
                                        <LoadingIndicator size={20} /> Loading
                                        first Tweet
                                    </TwitterOnboardingButtonContent>
                                }
                                onClick={() => {}}
                            />
                        </TwitterOnboardingContentBox>
                    </TwitterOnboardingContent>
                </TwitterOnboardingContainer>
            ) : (
                <LeftSide>
                    {this.state.loadState === 'running' ? (
                        <LoadingIndicatorBox>
                            <LoadingIndicator size={40} />
                            <DescriptionText>
                                Preparing a smooth ride
                            </DescriptionText>
                        </LoadingIndicatorBox>
                    ) : (
                        <ContentBox>
                            {this.state.authDialogMode === 'signup' && (
                                <>
                                    <Title>Welcome to Memex</Title>
                                </>
                            )}
                            {this.state.authDialogMode === 'login' && (
                                <UserScreenContainer>
                                    <Title>Welcome Back!</Title>
                                </UserScreenContainer>
                            )}
                            {this.state.authDialogMode === 'resetPassword' && (
                                <UserScreenContainer>
                                    <Title>Reset your password</Title>
                                    <DescriptionText>
                                        We'll send you an email with reset
                                        instructions
                                    </DescriptionText>
                                </UserScreenContainer>
                            )}
                            {this.state.authDialogMode ===
                                'ConfirmResetPassword' && (
                                <UserScreenContainer>
                                    <Title>Check your Emails</Title>
                                    <DescriptionText>
                                        Don't forget the spam folder!
                                    </DescriptionText>
                                </UserScreenContainer>
                            )}
                            <AuthDialog
                                onAuth={({ reason }) => {
                                    this.processEvent('onUserLogIn', {
                                        newSignUp: reason === 'register',
                                    })
                                }}
                                onModeChange={({ mode }) => {
                                    this.processEvent('setAuthDialogMode', {
                                        mode,
                                    })
                                }}
                            />
                        </ContentBox>
                    )}
                </LeftSide>
            )}
            {/* {this.renderInfoSide()} */}
        </WelcomeContainer>
    )

    render() {
        return <OnboardingBox>{this.renderLoginStep()}</OnboardingBox>
    }
}

const TwitterOnboardingButtonContent = styled.div`
    display: flex;
    grid-gap: 30px;
    align-items: center;
    justify-content: center;
    margin-left: 15px;
`

const TwitterOnboardingContentBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    grid-gap: 0px;
`

const TwitterOnboardingContainer = styled.div`
    display: flex;
    height: 100%;
    width: 100%;
    grid-gap: 60px;
    align-items: center;
`

const TwitterImage = styled.div`
    display: flex;
    height: 60%;
    width: fill-available;
    background-image: url('img/twitterOnboarding.svg');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: left;
    flex: 1;
`

const TwitterOnboardingContent = styled.div`
    display: flex;
    width: 100%;
    height: 60%;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    flex: 2;
`

const TwitterOnboardingSubtext = styled.div`
    display: flex;
    width: 100%;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 18px;
    margin-bottom: 30px;
`

const LoadingIndicatorBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 40px;
    height: 300px;
    width: 400px;
`

const UserScreenContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`

const WelcomeContainer = styled.div`
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    background-color: ${(props) => props.theme.colors.black};
    height: 100vh;
    background-image: url('img/welcomeScreenIllustration.svg');
    background-position: right;
    background-repeat: no-repeat;
    background-size: contain;
`

const openAnimation = keyframes`
 0% { opacity: 0; margin-top: 100px;}
 100% { opacity: 1; margin-top: 0px;}
`

const AnnotationBox = styled.div<{
    isActive: boolean
    zIndex: number
    order: number
}>`
    width: 99%;
    z-index: ${(props) => props.zIndex};

    animation-name: ${openAnimation};
    animation-duration: 600ms;
    animation-delay: ${(props) => props.order * 40}ms;
    animation-timing-function: cubic-bezier(0.16, 0.67, 0.47, 0.97);
    animation-fill-mode: backwards;
    position: relative;
`

const LeftSide = styled.div`
    width: fill-available;
    display: flex;
    align-items: center;
    z-index: 2;
    flex-direction: row;
    z-index: 2;
    /* position: absolute; */
    justify-content: flex-start;
    margin-left: 20%;
    animation-name: ${openAnimation};
    animation-duration: 600ms;
    animation-delay: ${(props) => props.order * 40}ms;
    animation-timing-function: cubic-bezier(0.16, 0.67, 0.47, 0.97);
    animation-fill-mode: backwards;
    position: relative;

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
    padding: 30px 50px;
    background: ${(props) => props.theme.colors.black}30;
    backdrop-filter: blur(5px);
    border-radius: 20px;
`

const Title = styled.div<{ fontSize?: string }>`
    background: ${(props) => props.theme.colors.headerGradient};
    font-size: ${(props) => props.fontSize ?? '30px'};
    font-weight: 800;
    margin-bottom: 20px;
    margin-top: 20px;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: left;
`

const DescriptionText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 18px;
    font-weight: 300;
    margin-bottom: 40px;
    text-align: left;
`

const RightSide = styled.div`
    width: min-content;
    height: 100vh;
    background-size: cover;
    background-repeat: no-repeat;
    grid-auto-flow: row;
    justify-content: center;
    align-items: center;
    position: absolute;
    right: 0;
    top: 0%;
    z-index: 1;

    @media (max-width: 1000px) {
        display: none;
    }
`

const CommentDemo = styled.img`
    height: fill-available;
    width: auto;
    margin: auto;
    opacity: 0.4;
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
const Header = styled.div`
    text-align: center;
    font-size: 16px;
    font-weight: bold;
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
    color: red;
    font-weight: bold;
    text-align: center;
`

const FormTitle = styled.div`
    font-weight: bold;
    font-size: 24px;
    color: ${(props) => props.theme.colors.primary};
    text-align: center;
`
const FormSubtitle = styled.div`
    font-weight: 500;
    font-size: 16px;
    text-align: center;
    color: ${(props) => props.theme.colors.secondary};
`

const AuthBox = styled(Margin)`
    display: flex;
    justify-content: center;
    width: 100%;
`

const Footer = styled.div`
    text-align: center;
    user-select: none;
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    opacity: 0.8;
`
const ModeSwitch = styled.span`
    cursor: pointer;
    font-weight: bold;
    color: ${(props) => props.theme.colors.prime1};
    font-weight: 14px;
`

const GoToDashboard = styled.span`
    cursor: pointer;
    font-weight: bold;
    color: ${(props) => props.theme.colors.prime1};
    font-size: 15px;
`
