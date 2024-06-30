import React from 'react'
import styled, { keyframes, css } from 'styled-components'

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
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    trackOnboardingPath,
    trackOnboardingSelection,
} from '@worldbrain/memex-common/lib/analytics/events'
import Checkbox from 'src/common-ui/components/Checkbox'
import UpgradeModal from 'src/authentication/upgrade-modal'
import Browser from 'webextension-polyfill'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'

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
        | 'analyticsBG'
        | 'bgScriptsBG'
        | 'browserAPIs'
    > = {
        authBG: runInBackground(),
        personalCloudBG: runInBackground(),
        bgScriptsBG: runInBackground(),
        contentScriptsBG: runInBackground(),
        navToDashboard: () => {
            window.location.href = OVERVIEW_URL
            window.location.reload()
        },
        navToGuidedTutorial: () => {
            window.open(GUIDED_ONBOARDING_URL)
        },
        analyticsBG: runInBackground(),
        browserAPIs: Browser,
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

    private renderSyncNotif() {
        return (
            <WelcomeContainer>
                <ContentBox>
                    {' '}
                    <LoadingIndicatorBoxSync>
                        <LoadingIndicator size={40} />
                    </LoadingIndicatorBoxSync>
                    <DescriptionText>
                        We're syncing your existing data. <br />
                        It may take a while for everything to show up.
                    </DescriptionText>
                    <PrimaryAction
                        type="secondary"
                        size="medium"
                        label="Go to Dashboard"
                        onClick={() => {
                            this.props.navToDashboard()
                        }}
                    />
                </ContentBox>
            </WelcomeContainer>
        )
    }

    private renderWelcomeStep = () => (
        <WelcomeBox>
            <TitleBox>
                <Title>
                    Welcome to
                    <br /> Memex
                </Title>
                <BetaButton>
                    <BetaButtonInner>BETA</BetaButtonInner>
                </BetaButton>
            </TitleBox>
            <DescriptionText>
                When something breaks or you have feature requests, <br />
                let us know via the live chat at every ? icon.{' '}
            </DescriptionText>
            <PrimaryAction
                label={'Continue'}
                icon={'longArrowRight'}
                onClick={() =>
                    this.processEvent('goToNextOnboardingStep', {
                        step: 'login',
                    })
                }
                type="primary"
                size={'large'}
            />
        </WelcomeBox>
    )
    private renderNudges = () => (
        <WelcomeBox>
            <Title>Enable Nudges</Title>
            <DescriptionText>
                We know its sometimes hard to get into the habit of a new tool.
                <br /> We've built in a few gentle nudges as you browse.
            </DescriptionText>
            <CheckBoxContainer>
                <Checkbox
                    label="Nudges enabled"
                    isChecked={this.state.enableNudges}
                    handleChange={async () => {
                        this.processEvent('enableNudges', null)
                    }}
                    width={'fit-content'}
                />
            </CheckBoxContainer>
            <PrimaryAction
                label={'Continue'}
                icon={'longArrowRight'}
                onClick={() =>
                    this.processEvent('goToNextOnboardingStep', {
                        step: 'nudges',
                    })
                }
                type="primary"
                size={'large'}
            />
        </WelcomeBox>
    )
    private renderBasicIntro = () => (
        <WelcomeBox>
            <Title>The absolute basics in 30 seconds</Title>
            <DescriptionText>
                Highly recommended to not skip this
            </DescriptionText>
            <VideoBox>
                <VideoIntro src="https://share.descript.com/embed/3YRS6Db30JN" />
            </VideoBox>
            {/* <DescriptionText>
                Every website has a small Memex icon in the bottom right corner.{' '}
                <br /> It's the jumping point for everything Memex.
            </DescriptionText> */}

            {/* {this.state.hoveredOverOnboardingIcon ? ( */}
            <ContinueButton>
                <PrimaryAction
                    label={'Continue'}
                    icon={'longArrowRight'}
                    onClick={() => this.props.navToDashboard()}
                    type="primary"
                    size={'large'}
                />
            </ContinueButton>
            {/* // ) : (
            //     <>
            //         <MemexActionButtonIntro
            //             onMouseEnter={() => {
            //                 this.processEvent('hoverOverOnboardingIcon', null)
            //             }}
            //             src={'img/memexActionButtonIntro.svg'}
            //         />
            //         <ContinueButtonNotif>
            //             Hover over the icon here to continue{' '}
            //             <ContinueIcon>
            //                 <Icon
            //                     icon={'longArrowRight'}
            //                     hoverOff
            //                     heightAndWidth="24px"
            //                     color="prime1"
            //                 />
            //             </ContinueIcon>
            //         </ContinueButtonNotif>
            //     </>
            // )} */}
        </WelcomeBox>
    )
    private renderPricingStep = () => (
        <>
            <WelcomeBox scale={this.state.scaleView}>
                <Title>Pricing</Title>
                <DescriptionText>
                    Upgrade before your trial runs out in 30 days to{' '}
                    <HighlightedText>get a 20% discount</HighlightedText>
                </DescriptionText>
                <UpgradeModalContainer>
                    <UpgradeModal
                        componentVariant="OnboardingStep"
                        authBG={this.props.authBG}
                        powerUpType="Bookmarks"
                        createCheckOutLink={
                            this.props.bgScriptsBG.createCheckoutLink
                        }
                        browserAPIs={this.props.browserAPIs}
                    />
                </UpgradeModalContainer>

                {/* {this.state.hoveredOverOnboardingIcon ? ( */}

                {/* // ) : (
            //     <>
            //         <MemexActionButtonIntro
            //             onMouseEnter={() => {
            //                 this.processEvent('hoverOverOnboardingIcon', null)
            //             }}
            //             src={'img/memexActionButtonIntro.svg'}
            //         />
            //         <ContinueButtonNotif>
            //             Hover over the icon here to continue{' '}
            //             <ContinueIcon>
            //                 <Icon
            //                     icon={'longArrowRight'}
            //                     hoverOff
            //                     heightAndWidth="24px"
            //                     color="prime1"
            //                 />
            //             </ContinueIcon>
            //         </ContinueButtonNotif>
            //     </>
            // )} */}
            </WelcomeBox>
            <ContinueButton>
                <PrimaryAction
                    label={'Continue'}
                    icon={'longArrowRight'}
                    onClick={() =>
                        this.processEvent('goToNextOnboardingStep', {
                            step: 'basicIntro',
                        })
                    }
                    type="primary"
                    size={'large'}
                />
            </ContinueButton>
        </>
    )
    private renderOnboardingOptions = () => (
        <WelcomeBox>
            <Title size="45px">
                Select the most important workflow you want from Memex?
            </Title>
            <DescriptionText>
                So we can get you from Zero to Aha! in the quickest way possible
            </DescriptionText>
            <OptionsBox>
                <OptionsContainer
                    onClick={async () => {
                        this.processEvent('setOnboardingTutorial', {
                            tutorialId: 'askAI',
                        })
                        await trackOnboardingPath(this.props.analyticsBG, {
                            type: 'AI',
                        })
                    }}
                >
                    <OptionTitle>
                        <Icon
                            icon={'play'}
                            heightAndWidth="30px"
                            color="prime1"
                            hoverOff
                        />
                        <OptionTitleText>
                            Summarizing & analysing content with AI
                        </OptionTitleText>
                    </OptionTitle>
                    {/* <OptionDescription>
                        Highlight text on a page and add tags
                    </OptionDescription> */}
                </OptionsContainer>
                <OptionsContainer
                    onClick={async () => {
                        this.processEvent('setOnboardingTutorial', {
                            tutorialId: 'savePages',
                        })
                        await trackOnboardingPath(this.props.analyticsBG, {
                            type: 'Bookmarking',
                        })
                    }}
                >
                    <OptionTitle>
                        <Icon
                            icon={'cursor'}
                            heightAndWidth="30px"
                            color="prime1"
                            hoverOff
                        />
                        <OptionTitleText>
                            Organising & Annotating websites, PDFs and Videos
                        </OptionTitleText>
                    </OptionTitle>
                    {/* <OptionDescription>
                        Highlight text on a page and add tags
                    </OptionDescription> */}
                </OptionsContainer>
                <OptionsContainer
                    onClick={async () => {
                        this.processEvent('setOnboardingTutorial', {
                            tutorialId: 'sharePages',
                        })
                        await trackOnboardingPath(this.props.analyticsBG, {
                            type: 'Sharing',
                        })
                    }}
                >
                    <OptionTitle>
                        <Icon
                            icon={'filePDF'}
                            heightAndWidth="30px"
                            color="prime1"
                            hoverOff
                        />
                        <OptionTitleText>
                            Sharing & collaborating with peers
                        </OptionTitleText>
                    </OptionTitle>
                </OptionsContainer>
                <OptionsContainer
                    onClick={async () => {
                        this.processEvent('setOnboardingTutorial', {
                            tutorialId: 'syncWithObsidianLogseq',
                        })
                        await trackOnboardingPath(this.props.analyticsBG, {
                            type: 'PKMsync',
                        })
                    }}
                >
                    <OptionTitle>
                        <Icon
                            icon={'reload'}
                            heightAndWidth="30px"
                            color="prime1"
                            hoverOff
                        />
                        <OptionTitleText>
                            Sync & web-clipper for Obsidian/Readwise/Logseq
                        </OptionTitleText>
                    </OptionTitle>
                </OptionsContainer>
            </OptionsBox>
            <PrimaryAction
                label={'Continue to Dashboard'}
                icon={'longArrowRight'}
                onClick={() =>
                    this.processEvent('goToNextOnboardingStep', {
                        step: 'finish',
                    })
                }
                type="tertiary"
                size={'large'}
            />
            {this.state.tutorialId != null ? (
                <TutorialBox
                    getRootElement={this.props.getRootElement}
                    tutorialId={this.state.tutorialId}
                    isHeadless={true}
                    onTutorialClose={() => {
                        this.processEvent('setOnboardingTutorial', {
                            tutorialId: null,
                        })
                    }}
                />
            ) : null}
        </WelcomeBox>
    )

    private renderLoginStep = () => (
        <WelcomeContainer>
            {this.state.loadState === 'running' ? (
                <ContentBox>
                    <LoadingIndicatorBox>
                        <LoadingIndicator size={40} />
                        <DescriptionText>
                            Preparing a smooth ride
                        </DescriptionText>
                    </LoadingIndicatorBox>
                </ContentBox>
            ) : (
                <ContentBox>
                    <>
                        {this.state.authDialogMode === 'signup' && (
                            <UserScreenContainer>
                                <Title>Sign Up</Title>
                            </UserScreenContainer>
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
                            browserAPIs={this.props.browserAPIs}
                        />
                    </>
                </ContentBox>
            )}
            {this.state.loadState === 'error' && (
                <AuthErrorMessage>
                    This account does not exist or the password is wrong.
                </AuthErrorMessage>
            )}
        </WelcomeContainer>
    )

    private renderOnboardingVideo = () => {
        return (
            <OnboardingContainer>
                <OnboardingVideo
                    src="https://share.descript.com/embed/QTnFzKBo7XM"
                    frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </OnboardingContainer>
        )
    }

    render() {
        return (
            <OnboardingBox>
                <OnboardingContent>
                    {/* {this.state.welcomeStep === 'pricingStep' &&
                        this.renderPricingStep()} */}
                    {this.state.welcomeStep === 'basicIntro' &&
                        this.renderOnboardingOptions()}
                    {/* {this.state.welcomeStep === 'ChooseOnboardingOption' &&
                        this.renderOnboardingOptions()} */}
                    {this.state.showSyncNotification &&
                        this.state.welcomeStep === 'finish' &&
                        this.renderSyncNotif()}
                    {!this.state.showOnboardingSelection &&
                        !this.state.showSyncNotification &&
                        this.state.welcomeStep === 'login' &&
                        this.renderLoginStep()}
                </OnboardingContent>
                {this.renderInfoSide()}
            </OnboardingBox>
        )
    }
}

const UpgradeModalContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    max-width: 800px;
    width: 60%;
    min-width: 800px;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    border-radius: 10px;
`

const OptionsBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    grid-gap: 15px;
    flex-direction: column;
    position: relative;
    margin-top: 20px;
    margin-bottom: 50px;
`

const OptionsContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    height: 80px;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    grid-gap: 15px;
    flex-direction: row;
    position: relative;
    width: 500px;
    padding: 0 30px;

    background: transparent;
    background-size: 0 0;
    background-size: cover;
    transition: background-image 1s ease-in-out;
    cursor: pointer;
    &:hover {
        background-image: url('img/welcomeScreenIllustration.svg');
    }
`

const OptionTitle = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    z-index: 2;
    white-space: nowrap;
`

const OptionTitleText = styled.div`
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 18px;
`

const ContinueButton = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    position: absolute;
    bottom: 50px;
    z-index: 2;
    font-size: 18px;
    color: ${(props) => props.theme.colors.prime1};
    right: 50px;
`

const moveRight = keyframes`
  0% { transform: translateX(0); }
  50% { transform: translateX(10px); }
  100% { transform: translateX(0); }
`

const ContinueIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ${moveRight} 1s ease-in-out infinite;
`

const OnboardingContent = styled.div`
    z-index: 1;
    position: relative;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
`

const CheckBoxContainer = styled.div`
    margin-bottom: 40px;
    margin-top: -10px;
`

const TitleBox = styled.div`
    margin-bottom: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`

const BetaButton = styled.div`
    display: flex;
    background: linear-gradient(
        90deg,
        #d9d9d9 0%,
        #2e73f8 0.01%,
        #0a4bca 78.86%,
        #0041be 100%
    );
    border-radius: 50px;
    height: 48px;
    width: 88px;
    align-items: center;
    justify-content: center;
`

const BetaButtonInner = styled.div`
    display: flex;
    background: ${(props) => props.theme.colors.black};
    color: #0a4bca;
    font-size: 20px;
    letter-spacing: 1px;
    height: 40px;
    width: 80px;
    font-weight: 600;
    align-items: center;
    justify-content: center;
    border-radius: 50px;
`

const RecommendedPill = styled.div`
    background-color: ${(props) => props.theme.colors.prime2};
    color: ${(props) => props.theme.colors.black};
    border-radius: 20px;
    padding: 4px 8px;
    font-size: 10px;
    position: absolute;
    bottom: 15px;
`

const OnboardingVideo = styled.iframe`
    width: 800px;
    height: 450px;
    border: 1px solid ${(props) => props.theme.colors.greyScale1};
    border-radius: 20px;
`

const OnboardingContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: fit-content;
    gap: 10px;
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

const LoadingIndicatorBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 40px;
    height: 300px;
    width: 400px;
`
const LoadingIndicatorBoxSync = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    height: 100px;
    width: 40px;
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
    height: 100vh;
    width: 100vw;
`

const ContentBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 30px 30px;
    border-radius: 20px;
    z-index: 2;
    width: 100vw;
    height: 100vh;
`

const Title = styled.div<{
    size?: string
}>`
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
    background-clip: text;
    font-size: ${(props) => (props.size ? props.size : '60px')};
    font-weight: 800;
    margin-bottom: 20px;
`

const DescriptionText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 20px;
    font-weight: 300;
    margin-bottom: 25px;
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
    position: absolute;
    right: 0;
    top: 0%;
    z-index: 0;

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

const VideoBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10px;
`

const VideoIntro = styled.iframe`
    border: 1px solid ${(props) => props.theme.colors.greyScale1};
    border-radius: 10px;
    width: 800px;
    height: 450px;
`

const HighlightedText = styled.span`
    color: ${(props) => props.theme.colors.prime1};
    font-weight: 600;
    display: inline;
`
const WelcomeBox = styled.div<{
    scale?: number
}>`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-width: 900px;

    ${(props) =>
        props.scale != null &&
        css`
            ${UpgradeModalContainer} {
                scale: ${props.scale};
            }
            ${Title} {
                scale: ${props.scale - 0.1};
            }
            ${DescriptionText} {
                scale: ${props.scale - 0.1};
            }
        `}
`
