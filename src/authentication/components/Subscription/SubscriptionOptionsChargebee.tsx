import * as React from 'react'
import { UserPlan } from '@worldbrain/memex-common/lib/subscriptions/types'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { auth, subscription } from 'src/util/remote-functions-background'
import {
    PlanTitle,
    PlanName,
    PlanBox,
} from 'src/authentication/components/Subscription/pricing.style'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import { SubscriptionInnerOptions } from 'src/authentication/components/Subscription/SubscriptionInnerOptions'
import {
    CenterText,
    WhiteSpacer10,
} from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'

interface Props {
    user: AuthenticatedUser | null
    onClose?: () => void
    plans: UserPlan[]
    onSubscriptionClicked?: () => void
}

interface State {
    subscribed: boolean | null
    showSubscriptionOptions: boolean
    subscriptionRefreshing?: boolean
}

export class SubscriptionOptionsChargebee extends React.Component<
    Props,
    State
> {
    public state = {
        subscribed: null,
        showSubscriptionOptions: true,
        subscriptionRefreshing: null,
    }

    async componentDidMount() {
        this.setState({
            subscribed: await auth.hasSubscribedBefore(),
        })
    }

    openPortal = async () => {
        this.props.onSubscriptionClicked?.()
        const portalLink = await subscription.getManageLink()
        window.open(portalLink['access_url'])
    }

    openCheckoutBackupYearly = async () => {
        this.props.onSubscriptionClicked?.()

        const checkoutExternalUrl = await subscription.getCheckoutLink({
            planId: 'pro-yearly',
        })
        window.open(checkoutExternalUrl.url)
    }

    openCheckoutBackupMonthly = async () => {
        this.props.onSubscriptionClicked?.()
        const checkoutExternalUrl = await subscription.getCheckoutLink({
            planId: 'pro-monthly',
        })
        window.open(checkoutExternalUrl.url)
    }

    handleSubscriptionRefresh = async () => {
        this.setState({
            subscriptionRefreshing: true,
        })
        await auth.refreshUserInfo()
        this.setState({
            subscriptionRefreshing: false,
        })
    }

    renderSubscriptionRefresh() {
        let onClick = () => null
        let child

        if (this.state.subscriptionRefreshing === true) {
            // child = "Refreshing..."
            child = <LoadingIndicator />
        } else if (this.state.subscriptionRefreshing === false) {
            child = 'Refreshed'
        } else {
            onClick = this.handleSubscriptionRefresh
            child = 'Refresh Subscription'
        }

        return (
            <CenterText>
                <PrimaryButton onClick={onClick}>{child}</PrimaryButton>
            </CenterText>
        )
    }

    render() {
        return (
            <div className={''}>
                <div>
                    {(this.props.plans?.length ?? 0) > 0 ? (
                        <PlanBox>
                            <PlanTitle>Your plan: </PlanTitle>
                            <PlanName>{this.props.plans}</PlanName>
                        </PlanBox>
                    ) : (
                        <>
                            <SubscriptionInnerOptions
                                openCheckoutBackupMonthly={
                                    this.openCheckoutBackupMonthly
                                }
                                openCheckoutBackupYearly={
                                    this.openCheckoutBackupYearly
                                }
                                openPortal={this.openPortal}
                                plans={this.props.plans}
                            />
                            <WhiteSpacer10 />
                            {this.renderSubscriptionRefresh()}
                            <WhiteSpacer10 />
                        </>
                    )}
                    <CenterText>
                        {this.state.subscribed && (
                            <PrimaryButton onClick={this.openPortal}>
                                {'Edit Subscriptions'}
                            </PrimaryButton>
                        )}
                    </CenterText>
                </div>
            </div>
        )
    }
}
