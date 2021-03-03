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
import { SubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/types'

export interface Props {
    auth: AuthRemoteFunctionsInterface
    subscription: SubscriptionsService
    contentScriptBackground: ContentScriptsInterface<'caller'>
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
`

export default class BetaFeatureNotif extends PureComponent<Props, State> {
    static defaultProps: Partial<Props> = {
        betaRequestStrategy: 'sign-in',
    }

    state: State = {
        loadState: 'running',
        chargebeeState: 'pristine',
        betaActivationState: 'pristine',
        isAuthenticating: this.props.initWithAuth,
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

    private openPortal = async () => {
        this.setState({ chargebeeState: 'running' })
        const portalLink = await this.props.subscription.getManageLink()
        window.open(portalLink['access_url'])
        this.setState({ chargebeeState: 'pristine' })
    }

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
        if (this.state.betaActivationState === 'success') {
            return (
                <SuccessBox>
                    <IconStyled src={icons.saveIcon} />
                    <TypographyHeadingBigger>
                        You're set.
                    </TypographyHeadingBigger>
                    <TypographyTextNormal>
                        You can now use Memex beta features.
                    </TypographyTextNormal>
                </SuccessBox>
            )
        }

        if (this.state.isAuthenticating) {
            return (
                <SignInScreen
                    onSuccess={this.onSignInSucces}
                    onFail={this.onSignInFail}
                />
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
