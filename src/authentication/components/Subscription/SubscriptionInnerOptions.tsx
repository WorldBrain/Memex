import { SubscriptionPriceBox } from 'src/authentication/components/Subscription/SubscriptionPriceBox'
import * as React from 'react'
import { UserPlan } from '@worldbrain/memex-common/lib/subscriptions/types'

interface Props {
    openCheckoutBackupMonthly?: () => void
    openCheckoutBackupYearly?: () => void
    openPortal?: () => void
    plans?: UserPlan[]
}

export class SubscriptionInnerOptions extends React.Component<Props> {
    render() {
        return (
            <div style={styles.subscriptionOptionsContainer}>
                <SubscriptionPriceBox
                    key={'SubscriptionBoxBackupsMonthly'}
                    onClick={this.props.openCheckoutBackupMonthly}
                    title={'Per Month'}
                    price={'€2'}
                    infoItems={[
                        'Automatic Backups every 15 min, locally or your favorite cloud provider',
                        '[SOON] End2End encrypted sync with your mobile device',
                    ]}
                    subscribed={
                        this.props.plans &&
                        this.props.plans.includes('pro-monthly')
                    }
                    manageSubscription={this.props.openPortal}
                />
                <SubscriptionPriceBox
                    key={'SubscriptionBoxBackupsYearly'}
                    onClick={this.props.openCheckoutBackupYearly}
                    price={'€20'}
                    title={'Per Year'}
                    infoItems={[
                        'Automatic Backups every 15 min, locally or your favorite cloud provider',
                        '[SOON] End2End encrypted sync with your mobile device',
                    ]}
                    subscribed={
                        this.props.plans &&
                        this.props.plans.includes('pro-yearly')
                    }
                    manageSubscription={this.props.openPortal}
                />
            </div>
        )
    }
}

const styles = {
    subscriptionOptionsContainer: {
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0 10px',
        marginTop: '10px',
    },
}
