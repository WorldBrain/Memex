import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import {
    PricingPlanTitle,
    PricingPlanItem,
    WhiteSpacer30,
    PlanTitle,
} from 'src/authentication/components/Subscription/pricing.style'

import { SubscriptionOptionsChargebee } from 'src/authentication/components/Subscription/SubscriptionOptionsChargebee'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'
import {
    CenterText,
    WhiteSpacer10,
} from 'src/common-ui/components/design-library/typography'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import { auth } from 'src/util/remote-functions-background'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
const styles = require('../styles.css')

type Props = {
    onClose: () => void
} & AuthContextInterface

interface State {
    showRefreshSubscription: boolean
    refreshing: boolean
}

class Subscribe extends React.Component<Props, State> {
    state = {
        showRefreshSubscription: false,
        refreshing: false,
    }

    handleClose = () => {
        this.props.onClose()
    }

    handleSubscriptionClicked = () => {
        this.setState({
            showRefreshSubscription: true,
        })
    }

    handleRefresh = async () => {
        this.setState({
            refreshing: true,
        })
        await auth.refreshUserInfo()
        this.setState({
            refreshing: false,
            showRefreshSubscription: false,
        })
    }

    componentDidUpdate(
        prevProps: Readonly<Props>,
        prevState: Readonly<State>,
        snapshot?: any,
    ) {
        // When the user has been updated (subscription refresh has changed the user), set the display back
        // to show the result (subscribed or not)
        if (prevProps.currentUser !== this.props.currentUser) {
            this.setState({ showRefreshSubscription: false })
        }
    }

    render() {
        if (this.props.currentUser === null) {
            return (
                <div className={styles.section}>
                    <div className={styles.instructionsTitle}>
                        {' Login or Create an Account'}
                    </div>
                    <div className={styles.instructions}>
                        {
                            ' To create an account just type in a new email address'
                        }
                    </div>
                    <SignInScreen />
                </div>
            )
        } else {
            if (this.state.showRefreshSubscription) {
                return (
                    <div>
                        <PricingPlanTitle>
                            Continue in new page
                        </PricingPlanTitle>
                        <CenterText>
                            Please wait for the new page to load and complete
                            the checkout process there, clicking refresh once
                            done.
                        </CenterText>
                        <WhiteSpacer10 />
                        <CenterText>
                            {this.state.refreshing ? (
                                <PrimaryButton onClick={() => null}>
                                    <LoadingIndicator />
                                </PrimaryButton>
                            ) : (
                                <PrimaryButton onClick={this.handleRefresh}>
                                    Refresh Subscription
                                </PrimaryButton>
                            )}
                        </CenterText>
                    </div>
                )
            }

            if ((this.props.currentUser?.authorizedPlans?.length ?? 0) > 0) {
                return (
                    <div>
                        <PricingPlanTitle className={''}>
                            💫 You're subscribed!
                        </PricingPlanTitle>
                        <WhiteSpacer30 />
                        <SubscriptionOptionsChargebee
                            user={this.props.currentUser}
                            plans={this.props.currentUser?.authorizedPlans}
                            onClose={this.handleClose}
                            onSubscriptionClicked={
                                this.handleSubscriptionClicked
                            }
                        />
                    </div>
                )
            } else {
                return (
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
                            onSubscriptionClicked={
                                this.handleSubscriptionClicked
                            }
                        />
                    </div>
                )
            }
        }
    }
}

export default withCurrentUser(Subscribe)
