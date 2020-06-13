import * as React from 'react'
import {
    SubscriptionCheckoutOptions,
    UserPlan,
} from '@worldbrain/memex-common/lib/subscriptions/types'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { auth, subscription } from 'src/util/remote-functions-background'
import {
    PlanTitle,
    PlanName,
    PlanBox,
} from 'src/authentication/components/Subscription/pricing.style'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import SubscriptionInnerOptions from 'src/authentication/components/Subscription/SubscriptionInnerOptions'
import {
    CenterText,
    WhiteSpacer10,
} from 'src/common-ui/components/design-library/typography'
import styled from 'styled-components'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'

interface Props {
    user: AuthenticatedUser | null
    onClose?: () => void
    plans: UserPlan[]
    onSubscriptionClicked?: () => void
    onSubscriptionOpened?: () => void
}

interface State {
    subscribed: boolean | null
    showSubscriptionOptions: boolean
    subscriptionRefreshing?: boolean
    loadingMonthly: boolean
    loadingYearly: boolean
    loadingPortal: boolean
}

class SubscriptionOptionsChargebee extends React.Component<
    Props & AuthContextInterface,
    State
> {
    public state = {
        subscribed: null,
        showSubscriptionOptions: true,
        subscriptionRefreshing: null,
        loadingMonthly: null,
        loadingYearly: null,
        loadingPortal: null,
    }

    async componentDidMount() {
        this.setState({
            subscribed: await auth.hasSubscribedBefore(),
        })
    }

    openPortal = async () => {
        this.props.onSubscriptionClicked?.()
        if (!this.props.currentUser) {
            return
        }

        this.setState({
            loadingPortal: true,
        })
        const portalLink = await subscription.getManageLink()

        if (portalLink?.access_url) {
            window.open(portalLink?.access_url)
            this.props.onSubscriptionOpened?.()
        }

        this.setState({
            loadingPortal: false,
        })
    }

    openCheckoutBackupYearly = async (
        options?: SubscriptionCheckoutOptions,
    ) => {
        this.props.onSubscriptionClicked?.()
        if (!this.props.currentUser) {
            return
        }

        this.setState({
            loadingYearly: true,
        })

        this.props.onSubscriptionClicked?.()
        const checkoutExternalUrl = await subscription.getCheckoutLink({
            planId: 'pro-yearly',
            ...options,
        })
        if (checkoutExternalUrl?.url) {
            window.open(checkoutExternalUrl.url)
            this.props.onSubscriptionOpened?.()
        }
    }

    openCheckoutBackupMonthly = async (
        options?: SubscriptionCheckoutOptions,
    ) => {
        this.props.onSubscriptionClicked?.()
        if (!this.props.currentUser) {
            return
        }
        this.setState({
            loadingMonthly: true,
        })
        this.props.onSubscriptionClicked?.()
        const checkoutExternalUrl = await subscription.getCheckoutLink({
            planId: 'pro-monthly',
            ...options,
        })

        if (checkoutExternalUrl?.url) {
            window.open(checkoutExternalUrl.url)
            this.props.onSubscriptionOpened?.()
        }
    }

    openCheckoutMonthly = async (options?: SubscriptionCheckoutOptions) => {
        await this.openCheckoutBackupMonthly(options).then(() => {
            this.setState({
                loadingMonthly: false,
            })
        })
    }

    openCheckoutYearly = async (options?: SubscriptionCheckoutOptions) => {
        await this.openCheckoutBackupYearly(options).then(() => {
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

        console.log(this.props.plans)

        return (
            <div className={''}>
                <div>
                        <SubscriptionInnerOptions
                            openCheckoutBackupMonthly={
                                this.openCheckoutMonthly
                            }
                            openCheckoutBackupYearly={
                                this.openCheckoutYearly
                            }
                            openPortal={this.openPortal}
                            plans={this.props.plans}
                            loadingMonthly={this.state.loadingMonthly}
                            loadingYearly={this.state.loadingYearly}
                            loadingPortal={this.state.loadingPortal}
                        />
                        <WhiteSpacer10 />
                </div>
            </div>
        )
    }
}

export default withCurrentUser(SubscriptionOptionsChargebee)
