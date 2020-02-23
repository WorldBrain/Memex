import * as React from 'react'
import { UserSubscription } from 'src/authentication/ui/user-subscription'
import { Helmet } from 'react-helmet'
import { UserPlan } from '@worldbrain/memex-common/lib/subscriptions/types'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { auth } from 'src/util/remote-functions-background'
import {
    PricingPlanTitle,
    PricingPlanItem,
    LoginTitle,
    LoginButton,
    WhiteSpacer30,
} from 'src/authentication/components/Subscription/pricing.style'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import styled from 'styled-components'
import { SubscriptionInnerOptions } from 'src/authentication/components/Subscription/SubscriptionInnerOptions'
import { CenterText } from 'src/common-ui/components/design-library/typography'
const chargeBeeScriptSource = 'https://js.chargebee.com/v2/chargebee.js'

export const subscriptionConfig = {
    site:
        process.env.NODE_ENV !== 'production'
            ? 'worldbrain-test'
            : 'worldbrain',
}

interface Props {
    user: AuthenticatedUser | null
    onClose?: () => void
    subscriptionChanged: () => void
    plans: UserPlan[]
}

interface State {
    subscribed: boolean | null
    showSubscriptionOptions: boolean
}

export class SubscriptionOptionsChargebee extends React.Component<
    Props,
    State
> {
    chargebeeInstance: any
    userSubscription: UserSubscription

    public state = { subscribed: null, showSubscriptionOptions: true }

    async componentDidMount() {
        this.setState({
            subscribed: await auth.hasSubscribedBefore(),
            showSubscriptionOptions: true,
        })
    }

    _initChargebee = (): void => {
        if (this.chargebeeInstance != null) {
            return
        }
        // todo: Handle offline cases better
        if (window['Chargebee'] == null) {
            return console.error(
                'Could not load payment provider as external script is not currently loaded.',
            )
        }
        this.chargebeeInstance = window['Chargebee'].init({
            site: subscriptionConfig.site,
        })
        this.userSubscription = new UserSubscription(this.chargebeeInstance)
    }

    openPortal = async () => {
        this._initChargebee()
        const portalEvents = await this.userSubscription.manageUserSubscription()

        portalEvents.addListener('closed', async () => {
            await auth.refreshUserInfo()
            this.props.onClose()
        })
        portalEvents.addListener('changed', () => {
            this.props.subscriptionChanged()
            this.props.onClose()
        })
    }

    openCheckoutBackupYearly = async () => {
        return this.openCheckout('pro-yearly')
    }

    openCheckoutBackupMonthly = async () => {
        return this.openCheckout('pro-monthly')
    }

    openCheckout = async (planId: UserPlan) => {
        this._initChargebee()
        const subscriptionEvents = await this.userSubscription.checkoutUserSubscription(
            { planId },
        )
        subscriptionEvents.addListener('closed', async () => {
            await auth.refreshUserInfo()
            this.props.onClose()
        })
        subscriptionEvents.addListener('changed', async () => {
            await auth.refreshUserInfo()
            this.props.subscriptionChanged()
            this.props.onClose()
        })
        subscriptionEvents.addListener('success', async () => {
            await auth.refreshUserInfo()
            this.props.subscriptionChanged()
            this.props.onClose()
        })
    }

    // TODO: monthly / yearly picker as in website?
    renderMonthlyYearlyChoice() {
        // let activeStatus = true
        //
        // return (
        //     <div>
        //         <PricingButtonWrapper>
        //             <Button
        //                 title="Monthly Plan"
        //                 className={activeStatus ? 'active-item' : ''}
        //                 onClick={() => {
        //                     // setState({
        //                     //     data: MONTHLY_PRICING_TABLE,
        //                     //     active: true,
        //                     // })
        //                 }}
        //             />
        //             <Button
        //                 title="Annual Plan"
        //                 className={activeStatus === false ? 'active-item' : ''}
        //                 onClick={() => {
        //                     // setState({
        //                     //     data: Data.saasJson.YEARLY_PRICING_TABLE,
        //                     //     active: false,
        //                     // })
        //                 }}
        //             />
        //         </PricingButtonWrapper>
        //     </div>
        // )
    }

    onClickShowSubscriptionOptions = () => {
        this.setState({ showSubscriptionOptions: true })
    }

    render() {
        return (
            <div className={''}>
                <Helmet>
                    <script src={chargeBeeScriptSource} />
                </Helmet>
                <div>
                    <SubscriptionInnerOptions
                        openCheckoutBackupMonthly={
                            this.openCheckoutBackupMonthly
                        }
                        openCheckoutBackupYearly={this.openCheckoutBackupYearly}
                        openPortal={this.openPortal}
                        plans={this.props.plans}
                    />

                    <CenterText>
                        {this.state.subscribed && (
                            <PrimaryButton onClick={this.openPortal}>
                                {'Existing Subscriptions'}
                            </PrimaryButton>
                        )}
                    </CenterText>
                </div>
            </div>
        )
    }
}

const AlreadySubscribedBox = styled.div`
    max-width: 350px;
    margin: 20px auto;
    text-align: center;
`

const SubscribedSpan = styled.span`
    max-width: 300px;
    font-size: 17px;
    font-weight: bold;
    text-align: center;
`

const StyledLine = styled.div`
    border: 0.5px solid #e0e0e0;
`

const HeaderBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
`

const SubscriptionOptionsButton = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
    align-items: center;
    align-content: space-around;
    padding: 20px;
    margin: 20px;
    width: 200px;
`

const Spacer = styled.div`
    margin: 15px;
`
