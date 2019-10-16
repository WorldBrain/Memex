import * as React from 'react'
import { UserSubscription } from 'src/authentication/components/user-subscription'
import Button from 'src/popup/components/Button'
const chargeBeeScriptSource = 'https://js.chargebee.com/v2/chargebee.js'
import { Helmet } from 'react-helmet'
import { SubscriptionPriceBox } from 'src/authentication/components/Subscription/SubscriptionPriceBox'
import { AuthenticatedUser } from 'src/authentication/background/types'
import { auth } from 'src/util/remote-functions-background'

export const subscriptionConfig = {
    site: 'wbstaging-test',
    defaultPlan: 'pro1',
}

interface Props {
    user: AuthenticatedUser | null
    onClose?: () => void
    subscriptionChanged: () => void
}
export class SubscriptionOptions extends React.PureComponent<Props> {
    chargebeeInstance: any
    userSubscription: UserSubscription
    private subscribed: boolean

    async componentDidMount() {
        this.subscribed = await auth.hasValidPlan('pro')
    }

    _initChargebee = (): void => {
        if (this.chargebeeInstance != null) {
            return
        }
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

    openPortal = async (planId = null) => {
        this._initChargebee()
        const portalEvents = await this.userSubscription.checkoutUserSubscription(
            {
                planId: planId || subscriptionConfig.defaultPlan,
            },
        )

        portalEvents.addListener('closed', () => this.props.onClose())
        portalEvents.addListener('changed', () => {
            this.props.subscriptionChanged()
            this.props.onClose()
        })
    }

    openCheckoutBackup = async () => {
        return this.openCheckout('backup_monthly')
    }

    openCheckoutBackupSync = async () => {
        return this.openCheckout('backupsync_monthly')
    }

    openCheckout = async (planId = null) => {
        this._initChargebee()
        const subscriptionEvents = await this.userSubscription.checkoutUserSubscription(
            {
                planId: planId || subscriptionConfig.defaultPlan,
            },
        )
        subscriptionEvents.addListener('closed', () => this.props.onClose())
        subscriptionEvents.addListener('changed', () => {
            this.props.subscriptionChanged()
            this.props.onClose()
        })
    }

    render() {
        return (
            <div className={''}>
                <Helmet>
                    <script src={chargeBeeScriptSource} />
                </Helmet>
                <h1 className={''}>Subscribe</h1>

                {this.subscribed !== true ? (
                    <div style={styles.subscriptionOptionsContainer}>
                        <SubscriptionPriceBox
                            onClick={undefined}
                            title={'Free'}
                            infoItems={[
                                'All offline features',
                                'Manual Backups',
                                'To your favorite cloud',
                                'No account necessary',
                            ]}
                        />
                        <SubscriptionPriceBox
                            onClick={_ => this.openCheckoutBackup()}
                            title={'Auto Backups'}
                            infoItems={[
                                "Everything in 'Free'",
                                'Automatic Backups every 15 min',
                                'To your favorite cloud',
                                'No account necessary',
                            ]}
                        />
                        <SubscriptionPriceBox
                            onClick={_ => this.openCheckoutBackupSync()}
                            title={'Auto Backup and Mobile Sync'}
                            infoItems={[
                                'Everything in Free & Auto Backups',
                                'Sync with mobile phone',
                                'IOS and Android App',
                            ]}
                        />
                    </div>
                ) : (
                    <Button onClick={_ => this.openPortal()}>
                        Manage Existing Subscription
                    </Button>
                )}
            </div>
        )
    }
}

const styles = {
    subscriptionOptionsContainer: {
        display: 'flex',
    },
}
