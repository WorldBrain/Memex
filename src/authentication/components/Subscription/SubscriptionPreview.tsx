import { PricingPlanTitle } from 'src/authentication/components/Subscription/pricing.style'
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
            <div onClick={this.props.onPress}>
                <PricingPlanTitle className={''}>
                    Subscribe to Memex Pro
                </PricingPlanTitle>

                <SubscriptionInnerOptions
                    openCheckoutBackupMonthly={this.props.onPress}
                    openCheckoutBackupYearly={this.props.onPress}
                />
            </div>
        )
    }
}
