import * as React from 'react'
import { SignInScreen } from 'src/authentication/components/SignIn'
import {
    PricingPlanTitle,
    PricingPlanItem,
    LoginTitle,
    LoginButton,
    WhiteSpacer30,
} from 'src/authentication/components/Subscription/pricing.style'

import { SubscriptionOptionsChargebee } from 'src/authentication/components/Subscription/SubscriptionOptionsChargebee'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { auth } from 'src/util/remote-functions-background'
const styles = require('../styles.css')

type Props = {
    onClose: () => void
} & UserProps

export class Subscribe extends React.PureComponent<Props> {
    handleSubscriptionChanged = () => {
        this.handleRefresh()
    }

    handleClose = () => {
        this.props.onClose()
    }

    handleRefresh = async () => {
        await auth.refreshUserInfo()
    }

    render() {
        return (
            <div>
                {this.props.currentUser == null && (
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

                {this.props.currentUser != null && (
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
                            plans={this.props.authorizedPlans}
                            onClose={this.handleClose}
                            subscriptionChanged={this.handleSubscriptionChanged}
                        />
                    </div>
                )}
            </div>
        )
    }
}

export default withCurrentUser(Subscribe)
