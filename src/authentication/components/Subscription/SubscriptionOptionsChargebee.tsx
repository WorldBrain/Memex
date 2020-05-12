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
    loadingMonthly: boolean
    loadingYearly: boolean
    loading: boolean
}

export class SubscriptionOptionsChargebee extends React.Component<
    Props,
    State
> {
    public state = {
        subscribed: null,
        showSubscriptionOptions: true,
        subscriptionRefreshing: null,
        loading: null,
        loadingMonthly: null,
        loadingYearly: null,
    }

    async componentDidMount() {
        this.setState({
            subscribed: await auth.hasSubscribedBefore(),
        })
    }

    openPortal = async () => {
        this.setState({
            loading: true,
        })
        this.props.onSubscriptionClicked?.()
        const portalLink = await subscription.getManageLink()
        window.open(portalLink['access_url'])
    }

    openPortalBridge = async () => {
        await this.openPortal().then(() => {
            this.setState({
                loading: false,
            })
        })
    }

    openCheckoutBackupYearly = async () => {
        this.props.onSubscriptionClicked?.()
        this.setState({
            loadingYearly: true,
        })

        const checkoutExternalUrl = await subscription.getCheckoutLink({
            planId: 'pro-yearly',
        })
        window.open(checkoutExternalUrl.url)
    }

    openCheckoutBackupMonthly = async () => {
        this.setState({
            loadingMonthly: true,
        })
        this.props.onSubscriptionClicked?.()
        const checkoutExternalUrl = await subscription.getCheckoutLink({
            planId: 'pro-monthly',
        })

        window.open(checkoutExternalUrl.url)
    }

    openCheckoutMonthly = async () => {
        await this.openCheckoutBackupMonthly().then(() => {
            this.setState({
                loadingMonthly: false,
            })
        })
    }

    openCheckoutYearly = async () => {
        await this.openCheckoutBackupYearly().then(() => {
            this.setState({
                loadingYearly: false,
            })
        })
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
        this.setState({
            loading: false,
        })

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
                                    this.openCheckoutMonthly
                                }
                                openCheckoutBackupYearly={
                                    this.openCheckoutYearly
                                }
                                openPortal={this.openPortalBridge}
                                plans={this.props.plans}
                                loadingMonthly={this.state.loadingMonthly}
                                loadingYearly={this.state.loadingYearly}
                            />
                            <WhiteSpacer10 />
                        </>
                    )}
                    <CenterText>
                        {this.state.subscribed && (
                            <div>
                                {this.state.loading ? (
                                    <PrimaryButton onClick={() => null}>
                                        <LoadingIndicator />
                                    </PrimaryButton>
                                ) : (
                                    <PrimaryButton
                                        onClick={this.openPortalBridge}
                                    >
                                        {'Edit Subscriptions'}
                                    </PrimaryButton>
                                )}
                            </div>
                        )}
                    </CenterText>
                </div>
            </div>
        )
    }
}
