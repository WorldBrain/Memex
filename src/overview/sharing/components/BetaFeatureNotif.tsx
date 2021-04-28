import { TaskState } from 'ui-logic-core/lib/types'
import React, { PureComponent } from 'react'
import styled from 'styled-components'

import {
    TypographyTextNormal,
    TypographyHeadingBigger,
} from 'src/common-ui/components/design-library/typography'
import * as icons from 'src/common-ui/components/design-library/icons'

import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { SignInScreen } from 'src/authentication/components/SignIn'
import { LoadingIndicator } from 'src/common-ui/components'
import { ContentScriptsInterface } from 'src/content-scripts/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { runInBackground } from 'src/util/webextensionRPC'
import DisplayNameSetup from 'src/overview/sharing/components/DisplayNameSetup'
import { auth } from 'src/util/remote-functions-background'



export interface Props {
    auth?: AuthRemoteFunctionsInterface
    contentScriptBackground?: ContentScriptsInterface<'caller'>
    showSubscriptionModal: () => void
    betaRequestStrategy?: 'go-to-options-page' | 'sign-in'
    initWithAuth?: boolean
}

interface State {
    loadState: TaskState
    chargebeeState: TaskState
    betaActivationState: TaskState
    isAuthenticated?: boolean
    isAuthenticating?: boolean
    isPioneer?: boolean
    hasSubscription?: boolean
    displayName?: string
    newDisplayName?: string
    updateProfileState: TaskState
}

const InstructionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
`

const InstructionsBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 30px;

    & > div {
        display: flex;
        justify-content: space-between;
    }

    & span {
        text-align: center;
    }
`

const ButtonBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 290px;
    align-items: center;
`

const Margin = styled.div`
    margin-bottom: 20px;
`

const InfoBox = styled.div`
    padding: 15px 30px;
    display: flex;
    justify-content: center;
    align-item: center;
    margin-top: 30px;
    background: #f29d9d;
    border-radius: 5px;

    & strong {
        margin-right: 5px;
    }
`
const IconStyled = styled.img`
    border: none;
    z-index: 2500;
    outline: none;
    border-radius: 3px;
    width: 30px;
    height: 30px;
    margin-bottom: 20px;
`

const SuccessBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    width: 100%;
`

const SurveyFrame = styled.iframe`
    width: 100%;
    height: 400px;
    border: 1px solid #f0f0f0;
`

const LoginScreenContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    & > span {
        text-align: center;
    }
`

export default class BetaFeatureNotif extends PureComponent<Props, State> {
    static defaultProps: Partial<Props> = {
        betaRequestStrategy: 'sign-in',
        contentScriptBackground: runInBackground(),
        auth: runInBackground(),
    }

    state: State = {
        loadState: 'running',
        chargebeeState: 'pristine',
        betaActivationState: 'pristine',
        isAuthenticating: this.props.initWithAuth,
        updateProfileState: 'pristine',
    }

    get isUnauthorizedUser(): boolean {
        return this.state.hasSubscription && !this.state.isPioneer
    }

    async componentDidMount() {
        const user = await this.props.auth.getCurrentUser()
        const plans = await this.props.auth.getAuthorizedPlans()
        const isBetaAuthorized = await this.props.auth.isAuthorizedForFeature(
            'beta',
        )

        this.getDisplayName()

        this.setState({
            loadState: 'success',
            isAuthenticated: !!user,
            isPioneer: isBetaAuthorized,
            hasSubscription: plans.length > 0,
        })

        if (this.props.initWithAuth) {
            if (await this.state.isAuthenticated) {
                this.activateBeta()
            } else {
                this.setState({ isAuthenticating: true })
            }
        }
    }

    async getDisplayName() {
        this.setState({ loadState: 'running' })
        try {
            const profile = await auth.getUserProfile()
            this.setState({
                loadState: 'success',
                displayName: profile?.displayName ?? undefined,
            })
        } catch (e) {
            this.setState({ loadState: 'error' })
            throw e
        }
    }


    // private openPortal = async () => {
    //     this.setState({ chargebeeState: 'running' })
    //     const portalLink = await this.props.subscription.getManageLink()
    //     window.open(portalLink['access_url'])
    //     this.setState({ chargebeeState: 'pristine' })
    // }

    onRequestAccess = () => {
        if (this.props.betaRequestStrategy === 'go-to-options-page') {
            this.props.contentScriptBackground.openBetaFeatureSettings()
            return
        }

        if (this.state.isAuthenticated) {
            this.activateBeta()
        } else {
            this.setState({ isAuthenticating: true })
        }
    }

    updateDisplayName = async () => {
        this.setState({
            updateProfileState: 'running',
        })
        try {
            await this.props.auth.updateUserProfile({
                displayName: this.state.newDisplayName,
            })
            this.setState({
                updateProfileState: 'success',
                displayName: this.state.newDisplayName,
                newDisplayName: undefined,
            })
        } catch (e) {
            this.setState({
                updateProfileState: 'error',
            })
            throw e
        }
    }

    async activateBeta() {
        this.setState({ betaActivationState: 'running' })
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const isBetaAuthorized = await this.props.auth.isAuthorizedForFeature(
            'beta',
        )
        if (!isBetaAuthorized) {
            await this.props.auth.setBetaEnabled(true)
        }
        this.setState({ betaActivationState: 'success' })
    }

    onSignInSucces = () => {
        this.setState({ isAuthenticating: false })
        this.activateBeta()
    }

    onSignInFail = () => {
        this.setState({ isAuthenticating: false })
    }

    render() {
        if (this.state.loadState === 'running') {
            return null
        }
        if (this.state.betaActivationState === 'running') {
            return <LoadingIndicator />
        }

        if (!this.state.displayName && this.state.betaActivationState === 'success') {
            return (
                <>
                     <InstructionsContainer>
                        <InstructionsBox>
                            <TypographyHeadingBigger>
                                What's your name?
                            </TypographyHeadingBigger>
                            <TypographyTextNormal>
                                This is how people know who the shared content is
                                from.
                                <br />
                                You can change this via the account settings later. 
                            </TypographyTextNormal>
                        </InstructionsBox>
                    </InstructionsContainer>
                    <DisplayNameSetup
                        name={this.state.newDisplayName}
                        onChange={(newDisplayName) => {
                            this.setState({ newDisplayName })
                        }}
                        onClickNext={this.updateDisplayName}
                    />
                </>
            )
        }

        if (this.state.betaActivationState === 'success' && this.state.displayName) {
            return (
                <SuccessBox>
                    <IconStyled src={icons.saveIcon} />
                    <TypographyHeadingBigger>
                        You're set.
                    </TypographyHeadingBigger>
                    <TypographyTextNormal>
                        You can now use Memex beta features.
                    </TypographyTextNormal>
                    <Margin />
                    <Margin />
                    <SurveyFrame src="https://airtable.com/embed/shrF9gmmYuL74XyIg?backgroundColor=cyan" />
                </SuccessBox>
            )
        }

        if (this.state.isAuthenticating) {
            return (
                <LoginScreenContainer>
                    <TypographyHeadingBigger>
                        Login or Create an Account
                    </TypographyHeadingBigger>
                    <TypographyTextNormal>
                        To create an account just type in a new email address
                    </TypographyTextNormal>
                    <Margin />
                    <SignInScreen />
                </LoginScreenContainer>
            )
        }

        return (
            <InstructionsContainer>
                <InstructionsBox>
                    <TypographyHeadingBigger>
                        🚀 This is a Beta Feature
                    </TypographyHeadingBigger>
                    <TypographyTextNormal>
                        Request early access and start using it.{' '}
                    </TypographyTextNormal>
                    <Margin />
                    <>
                        <ButtonBox>
                            <PrimaryAction
                                label="Request Access"
                                onClick={this.onRequestAccess}
                            />
                            <SecondaryAction
                                label="Watch Demo"
                                onClick={() =>
                                    window.open(
                                        'https://worldbrain.io/tutorials/sharing-features',
                                    )
                                }
                            />
                        </ButtonBox>
                    </>
                </InstructionsBox>
            </InstructionsContainer>
        )
    }
}
