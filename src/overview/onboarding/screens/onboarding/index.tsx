import React from 'react'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import Logic from './logic'
import type { State, Event, Dependencies } from './types'
import OnboardingBox from '../../components/onboarding-box'
import { OVERVIEW_URL } from 'src/constants'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

import AuthDialog from 'src/authentication/components/AuthDialog/index'
import { SignInScreen } from 'src/authentication/components/SignIn'

import { runInBackground } from 'src/util/webextensionRPC'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { GUIDED_ONBOARDING_URL } from '../../constants'
const ButtonBar = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`

const styles = require('../../components/onboarding-box.css')

export interface Props extends Dependencies {}

export default class OnboardingScreen extends StatefulUIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<
        Props,
        'navToDashboard' | 'authBG' | 'personalCloudBG' | 'navToGuidedTutorial'
    > = {
        authBG: runInBackground(),
        personalCloudBG: runInBackground(),
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

    private renderTutorialStep = () => (
        <WelcomeContainer>
            <LeftSide>
                <ContentBox>
                    <Title>Learn the basics in 90 seconds.</Title>
                    <DescriptionText>
                        Hop on our guided tutorial and get yourself up and
                        running in no time.
                    </DescriptionText>
                    <TutorialContainer>
                        <ConfirmContainer>
                            <PrimaryAction
                                onClick={() => {
                                    this.processEvent(
                                        'goToGuidedTutorial',
                                        null,
                                    )
                                }}
                                label={'Get Started'}
                                icon={'longArrowRight'}
                            />
                        </ConfirmContainer>
                        {/* <GoToDashboard
                            onClick={() => {
                                this.processEvent('finishOnboarding', null)
                            }}
                        >
                            or go to search dashboard
                        </GoToDashboard> */}
                    </TutorialContainer>
                </ContentBox>
            </LeftSide>
            {this.renderInfoSide()}
        </WelcomeContainer>
    )

    private renderSyncStep = () => (
        <div className={styles.welcomeScreen}>
            <div className={styles.loadingSpinner}>
                <LoadingIndicator />
            </div>
            <div className={styles.contentBox}>
                <div className={styles.titleText}>
                    Syncing with Existing Data
                </div>
                <div className={styles.descriptionText}>
                    This process continues in the background.
                    <br />
                    It may take a while for all data to appear in your dashboard
                    and you may experience temporary performance issues.
                </div>
            </div>
            <ButtonBar>
                <PrimaryAction
                    label="Go to Dashboard"
                    onClick={() => this.processEvent('finishOnboarding', null)}
                />
            </ButtonBar>
        </div>
    )

    private renderOnboardingSteps() {
        switch (this.state.step) {
            case 'tutorial':
                return this.renderTutorialStep()
            case 'sync':
            default:
                return this.renderSyncStep()
        }
    }

    private renderInfoSide = () => {
        return (
            <RightSide>
                <CommentDemo src={'img/welcomeScreenIllustration.svg'} />
            </RightSide>
        )
    }

    private renderLoginStep = (setSaveState) => (
        <>
            <WelcomeContainer>
                <LeftSide>
                    <ContentBox>
                        {this.state.authDialogMode === 'signup' && (
                            <>
                                <Title>Welcome to Memex</Title>
                                <DescriptionText>
                                    Create an account to get started
                                </DescriptionText>
                            </>
                        )}
                        {this.state.authDialogMode === 'login' &&
                            setSaveState !== 'running' && (
                                <UserScreenContainer>
                                    <Title>Welcome Back!</Title>
                                    <DescriptionText>
                                        Login to continue
                                    </DescriptionText>
                                </UserScreenContainer>
                            )}
                        {setSaveState === 'running' && <></>}
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
                            onModeChange={({ mode, setSaveState }) => {
                                this.processEvent('setAuthDialogMode', { mode })
                                this.processEvent('setSaveState', {
                                    setSaveState,
                                })
                            }}
                        />
                    </ContentBox>
                </LeftSide>
                {this.renderInfoSide()}
            </WelcomeContainer>
        </>
    )

    render() {
        return (
            <OnboardingBox>
                {this.state.shouldShowLogin
                    ? this.renderLoginStep(this.state.setSaveState)
                    : this.processEvent('finishOnboarding', null) &&
                      this.processEvent('goToGuidedTutorial', null)}
            </OnboardingBox>
        )
    }
}

const UserScreenContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`
const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const TutorialContainer = styled.div`
    display: grid;
    grid-gap: 20px;
    grid-auto-flow: column;
    align-items: center;
    justify-content: flex-start;
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

const DisplayNameContainer = styled.div`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    justify-content: flex-start;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 12px;
    opacity: 0.7;
    padding-left: 10px;
`

const FeatureInfoBox = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: row;
    justify-content: center;
    align-items: center;
`

const ConfirmContainer = styled.div`
    & > div {
        width: 100%;
        border-radius: 8px;
        height: 50px;
    }
`
const TextInputContainer = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    height: 50px;
    border-radius: 8px;
    width: 350px;
    padding: 0 15px;
`

const TextInput = styled.input`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
    border: none;
    background: transparent;

    &::placeholder {
        color: ${(props) => props.theme.colors.lighterText};
    }
`

const WelcomeContainer = styled.div`
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    background-color: ${(props) => props.theme.colors.black};
`

const LeftSide = styled.div`
    width: fill-available;
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
    align-items: center;
`

const Title = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 10px;
    margin-top: 30px;
    text-align: center;
`

const DescriptionText = styled.div`
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 18px;
    font-weight: 300;
    margin-bottom: 34px;
    text-align: center;
`

const RightSide = styled.div`
    width: min-content;
    height: 100vh;
    background-size: cover;
    background-repeat: no-repeat;
    grid-auto-flow: row;
    justify-content: center;
    align-items: center;

    @media (max-width: 1000px) {
        display: none;
    }
`

const CommentDemo = styled.img`
    height: fill-available;
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
    font-family: 'Satoshi';
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
