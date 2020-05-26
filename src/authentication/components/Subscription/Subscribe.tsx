import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import {
    LoginButton,
    LoginTitle,
    PricingPlanItem,
    PricingPlanTitle,
    WhiteSpacer30,
} from 'src/authentication/components/Subscription/pricing.style'

import SubscriptionOptionsChargebee from 'src/authentication/components/Subscription/SubscriptionOptionsChargebee'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'

const styles = require('../styles.css')

type Props = {
    onClose: () => void
} & AuthContextInterface

type DisplayState =
    | 'loading'
    | 'login'
    | 'plans'
    | 'subscribed'
    | 'subscription_opened'

interface State {
    display: DisplayState
}

const getUserPlans = (currentUser) => currentUser?.authorizedPlans?.length ?? 0
const userHasPlans = (currentUser) =>
    (currentUser?.authorizedPlans?.length ?? 0) > 0

class Subscribe extends React.Component<Props, State> {
    state = {
        display: 'plans' as DisplayState,
    }

    handleClose = () => {
        this.props.onClose()
    }

    showPlansOrSubscribed = (currentUser) =>
        getUserPlans(currentUser) ? 'subscribed' : 'plans'

    handleSubscriptionClicked = async () => {
        if (this.props.currentUser === null) {
            this.setState({ display: 'login' })
        }
    }

    handleSubscriptionOpened = async () => {
        this.setState({ display: 'subscription_opened' })
        // Clear loading indicator 5s after opening window in case coming back after not changing.
        await new Promise((resolve) => setTimeout(resolve, 5000))
        this.setState({
            display: this.showPlansOrSubscribed(this.props.currentUser),
        })
    }

    showLogin = () => this.setState({ display: 'login' })

    componentDidMount() {
        this.setState({
            display: this.props.loadingUser
                ? 'loading'
                : this.showPlansOrSubscribed(this.props.currentUser),
        })
    }

    componentDidUpdate(
        prevProps: Readonly<Props>,
        prevState: Readonly<State>,
        snapshot?: any,
    ) {
        if (
            this.props.loadingUser !== prevProps.loadingUser &&
            this.props.loadingUser
        ) {
            this.setState({ display: 'loading' })
        } else {
            const userUpdated = this.props.currentUser !== prevProps.currentUser
            const plansUpdated =
                getUserPlans(prevProps.currentUser) !==
                getUserPlans(this.props.currentUser)
            if (userUpdated || plansUpdated) {
                this.setState({
                    display: this.showPlansOrSubscribed(this.props.currentUser),
                })
            }
        }
    }

    renderLoading = () => (
        <div className={styles.loadingBox}>
            <LoadingIndicator />
        </div>
    )

    renderLogin = () => (
        <div className={styles.section}>
            <div className={styles.instructionsTitle}>
                {' Login or Create an Account'}
            </div>
            <div className={styles.instructions}>
                {' To create an account just type in a new email address'}
            </div>
            <SignInScreen />
        </div>
    )

    renderSubscribed = () => (
        <div>
            <PricingPlanTitle className={''}>
                💫 You're subscribed!
            </PricingPlanTitle>
            <WhiteSpacer30 />
            <SubscriptionOptionsChargebee
                user={this.props.currentUser}
                plans={this.props.currentUser?.authorizedPlans}
                onClose={this.handleClose}
                onSubscriptionClicked={this.handleSubscriptionClicked}
                onSubscriptionOpened={this.handleSubscriptionOpened}
            />
        </div>
    )

    renderPlans = () => (
        <div>
            <PricingPlanTitle className={''}>
                ⭐️ Upgrade to Memex Pro
            </PricingPlanTitle>

            <PricingPlanItem className={''}>
                📲 Encrypted Sync with your iOS or Android phone
            </PricingPlanItem>

            <PricingPlanItem className={''}>
                💾 Automatic Backups
            </PricingPlanItem>

            <WhiteSpacer30 />
            <SubscriptionOptionsChargebee
                user={this.props.currentUser}
                plans={this.props.currentUser?.authorizedPlans}
                onClose={this.handleClose}
                onSubscriptionClicked={this.handleSubscriptionClicked}
                onSubscriptionOpened={this.handleSubscriptionOpened}
            />

            {!this.props.currentUser && (
                <div>
                    <LoginTitle className={''}>
                        Already have a subscription?
                    </LoginTitle>
                    <LoginButton className={''} onClick={this.showLogin}>
                        Login
                    </LoginButton>
                </div>
            )}
        </div>
    )

    render() {
        switch (this.state.display) {
            case 'loading':
                return this.renderLoading()
            case 'login':
                return this.renderLogin()
            case 'plans':
                return this.renderPlans()
            case 'subscribed':
                return this.renderSubscribed()
            case 'subscription_opened':
                return this.renderLoading()
            default:
                return <div> {`invalid sate: ${this.state.display}`}</div>
        }
    }
}

export default withCurrentUser(Subscribe)
