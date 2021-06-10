import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import {
    LoginButton,
    LoginTitle,
    PricingPlanItem,
    PricingPlanTitle,
    WhiteSpacer30,
    TrialInfo,
} from 'src/authentication/components/Subscription/pricing.style'
import styled from 'styled-components'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

import PioneerPlanBanner from 'src/common-ui/components/pioneer-plan-banner'
import { getLocalStorage, setLocalStorage } from 'src/search-injection/utils'
import { STORAGE_KEYS as DASHBOARD_STORAGE_KEYS } from 'src/dashboard-refactor/constants'

import SubscriptionOptionsChargebee from 'src/authentication/components/Subscription/SubscriptionOptionsChargebee'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'

const styles = require('../styles.css')

const PioneerPlanContainer = styled.div`
    display: flex;
    padding: 10px 15px;
    justify-content: space-between;
    align-items: center;
    background: #f0f0f0;
    border-radius: 3px;
    margin-bottom: 30px;
    width: 760px;
`
const PioneerPlanContentBox = styled.div`
    display: flex;
    flex-direction: column;
`

const PioneerPlanTitle = styled.div`
    font-weight: bold; 
    font-size: 14px;
`

const PioneerPlanDescription = styled.div`
    font-size: 12px;
`

const PioneerPlanButtonBox = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 5px;
    margin-right: -5px;
`

const PioneerPlanLearnMoreButton = styled(SecondaryAction)`
`

const PioneerPlanUpgradeButton = styled(PrimaryAction)`
`


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
    isSubscriptionBannerShown: boolean
}

const getUserPlans = (currentUser) => currentUser?.authorizedPlans?.length ?? 0
const userHasPlans = (currentUser) =>
    (currentUser?.authorizedPlans?.length ?? 0) > 0

class Subscribe extends React.Component<Props, State> {
    state = {
        display: 'plans' as DisplayState,
        isSubscriptionBannerShown: true,
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

    private handleSubBannerDismiss: React.MouseEventHandler = async (e) => {
        this.setState({ isSubscriptionBannerShown: false })
        await setLocalStorage(DASHBOARD_STORAGE_KEYS.subBannerDismissed, true)
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
        <div className={styles.PriceBox}>
            <PricingPlanTitle className={''}>
                💫 You successfully subscribed!
            </PricingPlanTitle>
        </div>
    )

    renderPlans = () => (
        <div className={styles.PriceBox}>
            <PioneerPlanBanner/>

            <PricingPlanTitle className={''}>
                ⭐️ Upgrade your Memex
            </PricingPlanTitle>
            <TrialInfo>30 days free trial</TrialInfo>

            {/*<PricingPlanItem className={''}>*/}
            {/*    📲 Encrypted Sync with your iOS or Android phone*/}
            {/*</PricingPlanItem>*/}

            {/*<PricingPlanItem className={''}>*/}
            {/*    💾 Automatic Backups*/}
            {/*</PricingPlanItem>*/}

            <SubscriptionOptionsChargebee
                user={this.props.currentUser}
                plans={this.props.currentUser?.authorizedPlans}
                onClose={this.handleClose}
                onSubscriptionClicked={this.handleSubscriptionClicked}
                onSubscriptionOpened={this.handleSubscriptionOpened}
            />

            {/*{!this.props.currentUser && (
                <div>
                    <LoginTitle className={''}>
                        Already have a subscription?
                    </LoginTitle>
                    <LoginButton className={''} onClick={this.showLogin}>
                        Login
                    </LoginButton>
                </div>
            )}*/}
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
