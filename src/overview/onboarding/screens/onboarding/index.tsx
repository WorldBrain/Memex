import React from 'react'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import Logic from './logic'
import type { State, Event, Dependencies } from './types'
import OnboardingBox from '../../components/onboarding-box'
import { OVERVIEW_URL } from 'src/constants'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import Margin from 'src/dashboard-refactor/components/Margin'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

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
                    <SectionCircle>
                        <Icon
                            filePath={icons.check}
                            heightAndWidth="34px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
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
                                fontSize={'14px'}
                            />
                        </ConfirmContainer>
                        <GoToDashboard
                            onClick={() => {
                                this.processEvent('finishOnboarding', null)
                            }}
                        >
                            or go to search dashboard
                        </GoToDashboard>
                    </TutorialContainer>
                </ContentBox>
            </LeftSide>
            {this.RenderInfoSide()}
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

    private checkPasswordMatch(value) {
        if (this.state.password === value) {
            this.processEvent('passwordMatch', { value: true })
        } else {
            this.processEvent('passwordMatch', { value: false })
        }
    }

    renderAuthForm() {
        const { state } = this
        // const { header } = state

        if (this.state.mode !== 'login') {
            return (
                <StyledAuthDialog>
                    <AuthBox top="medium">
                        <AuthenticationMethods>
                            <EmailPasswordLogin>
                                <DisplayNameContainer>
                                    <TextInputContainer>
                                        <Icon
                                            filePath={icons.personFine}
                                            heightAndWidth="20px"
                                            hoverOff
                                        />
                                        <TextInput
                                            type="DisplayName"
                                            placeholder="Display Name"
                                            value={this.state.displayName}
                                            onChange={(e) =>
                                                this.processEvent(
                                                    'editDisplayName',
                                                    {
                                                        value: e.target.value,
                                                    },
                                                )
                                            }
                                            onConfirm={() => {
                                                this.processEvent(
                                                    'emailPasswordConfirm',
                                                    null,
                                                )
                                            }}
                                        />
                                    </TextInputContainer>
                                    <InfoText>
                                        Name shown on shared Spaces, page links
                                        and annotations
                                    </InfoText>
                                </DisplayNameContainer>
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
                                        onConfirm={() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        }}
                                    />
                                </TextInputContainer>
                                <TextInputContainer>
                                    <Icon
                                        filePath={icons.lockFine}
                                        heightAndWidth="20px"
                                        hoverOff
                                    />
                                    <TextInput
                                        type="password"
                                        placeholder="Password"
                                        value={this.state.password}
                                        onChange={(e) =>
                                            this.processEvent('editPassword', {
                                                value: e.target.value,
                                            })
                                        }
                                        onConfirm={() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        }}
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
                                        value={this.state.passwordConfirm}
                                        onChange={(e) => {
                                            this.processEvent(
                                                'editPasswordConfirm',
                                                {
                                                    value: e.target.value,
                                                },
                                            )
                                            this.checkPasswordMatch(
                                                e.target.value,
                                            )
                                        }}
                                    />
                                </TextInputContainer>
                                <ConfirmContainer>
                                    <PrimaryAction
                                        onClick={() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        }}
                                        disabled={
                                            !(
                                                this.state.passwordMatch &&
                                                this.state.email.includes(
                                                    '@',
                                                ) &&
                                                this.state.email.includes(
                                                    '.',
                                                ) &&
                                                this.state.displayName.length >=
                                                    3
                                            )
                                        }
                                        label={'Sign Up'}
                                        fontSize={'14px'}
                                    />
                                    {/* {this.renderAuthError()} */}
                                </ConfirmContainer>
                                {this.renderLoginTypeSwitcher()}
                            </EmailPasswordLogin>
                        </AuthenticationMethods>
                    </AuthBox>
                </StyledAuthDialog>
            )
        } else {
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
                                        onConfirm={() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        }}
                                    />
                                </TextInputContainer>
                                <TextInputContainer>
                                    <Icon
                                        filePath={icons.lockFine}
                                        heightAndWidth="20px"
                                        hoverOff
                                    />
                                    <TextInput
                                        type="password"
                                        placeholder="Password"
                                        value={this.state.password}
                                        onChange={(e) =>
                                            this.processEvent('editPassword', {
                                                value: e.target.value,
                                            })
                                        }
                                        onConfirm={() => {
                                            this.processEvent(
                                                'emailPasswordConfirm',
                                                null,
                                            )
                                        }}
                                    />
                                </TextInputContainer>
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
                                        fontSize={'14px'}
                                    />
                                    {/* {this.renderAuthError()} */}
                                </ConfirmContainer>
                                {this.renderLoginTypeSwitcher()}
                            </EmailPasswordLogin>
                        </AuthenticationMethods>
                    </AuthBox>
                </StyledAuthDialog>
            )
        }
    }

    private renderLoginTypeSwitcher() {
        return (
            <Footer>
                {this.state.mode === 'login' && (
                    <>
                        Don’t have an account?{' '}
                        <ModeSwitch
                            onClick={() =>
                                this.processEvent('toggleMode', null)
                            }
                        >
                            Sign up
                        </ModeSwitch>
                    </>
                )}
                {this.state.mode === 'signup' && (
                    <>
                        Already have an account?{' '}
                        <ModeSwitch
                            onClick={() =>
                                this.processEvent('toggleMode', null)
                            }
                        >
                            Log in
                        </ModeSwitch>
                    </>
                )}
            </Footer>
        )
    }

    private RenderInfoSide = () => {
        return (
            <RightSide>
                <CommentDemo src={'img/commentDemo.svg'} />
                <FeatureInfoBox>
                    <TitleSmall>
                        Curate, annotate and discuss the web
                    </TitleSmall>
                    <DescriptionText>
                        By yourself and with your team, friends and community.
                    </DescriptionText>
                </FeatureInfoBox>
            </RightSide>
        )
    }

    private renderLoginStep = () => (
        <>
            <WelcomeContainer>
                <LeftSide>
                    {this.state.mode === 'login' ? (
                        <ContentBox>
                            <LogoImg src={'/img/onlyIconLogo.svg'} />
                            <Title>Welcome back!</Title>
                            <DescriptionText></DescriptionText>
                            {this.renderAuthForm()}
                        </ContentBox>
                    ) : (
                        <ContentBox>
                            <LogoImg src={'/img/onlyIconLogo.svg'} />
                            <Title>Welcome to Memex</Title>
                            <DescriptionText>
                                Create an account to get started
                            </DescriptionText>
                            {this.renderAuthForm()}
                        </ContentBox>
                    )}
                </LeftSide>
                {this.RenderInfoSide()}

                {/* <SignInScreen
                onSuccess={(isNewUser) => {
                    this.processEvent('onUserLogIn', { newSignUp: isNewUser })
                    this.processEvent('goToGuidedTutorial', null)
                    //this.processEvent('finishOnboarding', null)
                }}
            /> */}
            </WelcomeContainer>
        </>
    )

    render() {
        return (
            <OnboardingBox>
                {this.state.shouldShowLogin
                    ? this.renderLoginStep()
                    : this.renderOnboardingSteps()}
            </OnboardingBox>
        )
    }
}

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
`

const LeftSide = styled.div`
    width: 60%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

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
`

const Title = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 10px;
    margin-top: 30px;
`

const DescriptionText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
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
    font-family: 'Inter';
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
    color: ${(props) => props.theme.colors.purple};
    font-weight: 14px;
`

const GoToDashboard = styled.span`
    cursor: pointer;
    font-weight: bold;
    color: ${(props) => props.theme.colors.purple};
    font-size: 15px;
`
