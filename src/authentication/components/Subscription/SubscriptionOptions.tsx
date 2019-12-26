import * as React from 'react'
import { UserSubscription } from 'src/authentication/ui/user-subscription'
import { Helmet } from 'react-helmet'
import { SubscriptionPriceBox } from 'src/authentication/components/Subscription/SubscriptionPriceBox'
import { UserPlan } from '@worldbrain/memex-common/lib/subscriptions/types'
import { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'
import { auth } from 'src/util/remote-functions-background'
import { PricingPlanTitle } from 'src/authentication/components/Subscription/pricing.style'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import styled from 'styled-components'
import {
    TypographyHeadingSmall,
    TypographyLink,
} from 'src/common-ui/components/design-library/typography'
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

export class SubscriptionOptions extends React.Component<Props, State> {
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

                {/*{this.renderMonthlyYearlyChoice()}*/}
                    <div>
                        <PricingPlanTitle className={''}>
                            Subscribe to Memex Pro
                        </PricingPlanTitle>

                        <div style={styles.subscriptionOptionsContainer}>
                            <SubscriptionPriceBox
                                key={'SubscriptionBoxBackupsMonthly'}
                                onClick={_ => this.openCheckoutBackupMonthly()}
                                title={'Per Month'}
                                price={'€2'}
                                infoItems={[
                                    'Automatic Backups every 15 min, locally or your favorite cloud provider',
                                    '[SOON] End2End encrypted sync between your devices. 2 devices included',
                                    '+1€ per additional device',
                                ]}
                                subscribed={this.props.plans.includes(
                                    'pro-monthly',
                                )}
                                manageSubscription={this.openPortal}
                            />
                            <SubscriptionPriceBox
                                key={'SubscriptionBoxBackupsYearly'}
                                onClick={_ => this.openCheckoutBackupYearly()}
                                price={'€20'}
                                title={'Per Year'}
                                infoItems={[
                                    'Automatic Backups every 15 min, locally or your favorite cloud provider',
                                    '[SOON] End2End encrypted sync between your devices. 2 devices included',
                                    '+10€ per additional device',
                                ]}
                                subscribed={this.props.plans.includes(
                                    'pro-yearly',
                                )}
                                manageSubscription={this.openPortal}
                            />
                        </div>
                        {this.state.subscribed === true && (
                            <AlreadySubscribedBox>
                                <SubscribedSpan> 🎉 You've already subscribed to a plan </SubscribedSpan>
                                <PrimaryButton onClick={this.openPortal}>
                                    Manage Existing Subscription
                                </PrimaryButton>
                            </AlreadySubscribedBox>
                        )}
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

const styles = {
    subscriptionOptionsContainer: {
        display: 'flex',
    },
}
