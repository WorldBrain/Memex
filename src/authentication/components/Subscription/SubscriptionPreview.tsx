import {
    PricingPlanTitle,
    PricingPlanItem,
    LoginTitle,
    LoginButton,
    WhiteSpacer30,
} from 'src/authentication/components/Subscription/pricing.style'
import { SubscriptionInnerOptions } from 'src/authentication/components/Subscription/SubscriptionInnerOptions'
import * as React from 'react'

interface Props {
    onPress: () => void
}

// This shows a version of the Subscription Plan picker that is a 'preview'
// meaning it doesn't launch the Chargebee code yet, it allows the user
// to see the subscriptions without needing to be logged in or loading any
// Chargebee code yet.
export class SubscriptionPreview extends React.Component<Props> {
    render() {
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

                <SubscriptionInnerOptions
                    openCheckoutBackupMonthly={this.props.onPress}
                    openCheckoutBackupYearly={this.props.onPress}
                />
                <LoginTitle className={''}>
                    Already have a subscription?
                </LoginTitle>
                <LoginButton className={''} onClick={this.props.onPress}>
                    Login
                </LoginButton>
            </div>
        )
    }
}
