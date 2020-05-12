import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import {
    PricingPlanTitle,
    PricingPlanItem,
    WhiteSpacer30,
    PlanTitle,
    LoginTitle,
    LoginButton,
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
    refreshing: boolean
    loading: boolean
    showOptions: boolean
    showLogin: boolean
    showSuccess: boolean
}

class Subscribe extends React.Component<Props, State> {
    state = {
        refreshing: false,
        loading: true,
        showOptions: false,
        showLogin: false,
        showSuccess: false,
    }

    handleClose = () => {
        this.props.onClose()
    }

    componentWillMount() {
        this.setState({
            loading: true,
        })
    }

    componentDidMount() {
        this.setState({
            loading: true,
        })
        setTimeout(() => {
            this.setState({
                loading: false,
                showOptions: true,
            })
        }, 1000)
    }

    handleSubscriptionClicked = () => {
        if (this.props.currentUser === null) {
            this.setState({
                showLogin: true,
                showOptions: false,
            })
        } else {
            this.setState({
                showOptions: true,
                showLogin: false,
            })
        }
    }

    handleRefresh = async () => {
        this.setState({
            refreshing: true,
        })
        await auth.refreshUserInfo()
        this.setState({
            refreshing: false,
        })
    }

    componentDidUpdate(
        prevProps: Readonly<Props>,
        prevState: Readonly<State>,
        snapshot?: any,
    ) {
        // When the user has been updated (subscription refresh has changed the user), set the display back
        // to show the result (subscribed or not)

        if (this.props.currentUser) {
            if (
                (this.props.currentUser?.authorizedPlans?.length ?? 0) === 0 &&
                !this.state.showOptions &&
                !prevState.showOptions
            ) {
                this.setState({
                    showLogin: false,
                    showOptions: true,
                    showSuccess: false,
                })
            }

            if (
                (prevProps.currentUser?.authorizedPlans?.length ?? 0) !==
                    (this.props.currentUser?.authorizedPlans?.length ?? 0) &&
                (this.props.currentUser?.authorizedPlans?.length ?? 0) > 0
            ) {
                this.setState({
                    showLogin: false,
                    showOptions: false,
                    showSuccess: true,
                })
            }
        }
    }

    render() {
        return (
            <div>
                {this.state.loading ? (
                    <div className={styles.loadingBox}>
                        <LoadingIndicator />
                    </div>
                ) : (
                    <div>
                        {this.state.showLogin && (
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
                        )}
                        {this.state.showSuccess && (
                            <div>
                                <PricingPlanTitle className={''}>
                                    💫 You're subscribed!
                                </PricingPlanTitle>
                                <WhiteSpacer30 />
                                <SubscriptionOptionsChargebee
                                    user={this.props.currentUser}
                                    plans={
                                        this.props.currentUser?.authorizedPlans
                                    }
                                    onClose={this.handleClose}
                                    onSubscriptionClicked={
                                        this.handleSubscriptionClicked
                                    }
                                />
                            </div>
                        )}

                        {this.state.showOptions && (
                            <div>
                                <PricingPlanTitle className={''}>
                                    ⭐️ Upgrade to Memex Pro
                                </PricingPlanTitle>

                                <PricingPlanItem className={''}>
                                    📲 Encrypted Sync with your iOS or Android
                                    phone
                                </PricingPlanItem>

                                <PricingPlanItem className={''}>
                                    💾 Automatic Backups
                                </PricingPlanItem>

                                <WhiteSpacer30 />
                                <SubscriptionOptionsChargebee
                                    user={this.props.currentUser}
                                    plans={
                                        this.props.currentUser?.authorizedPlans
                                    }
                                    onClose={this.handleClose}
                                    onSubscriptionClicked={
                                        this.handleSubscriptionClicked
                                    }
                                />

                                {!this.props.currentUser && (
                                    <div>
                                        <LoginTitle className={''}>
                                            Already have a subscription?
                                        </LoginTitle>
                                        <LoginButton
                                            className={''}
                                            onClick={
                                                this.handleSubscriptionClicked
                                            }
                                        >
                                            Login
                                        </LoginButton>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }
}

export default withCurrentUser(Subscribe)
