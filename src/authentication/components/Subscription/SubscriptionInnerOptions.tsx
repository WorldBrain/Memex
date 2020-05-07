import { SubscriptionPriceBox } from 'src/authentication/components/Subscription/SubscriptionPriceBox'
import * as React from 'react'
import { UserPlan } from '@worldbrain/memex-common/lib/subscriptions/types'

interface Props {
    openCheckoutBackupMonthly?: () => void
    openCheckoutBackupYearly?: () => void
    openPortal?: () => void
    plans?: UserPlan[]
    loadingMonthly: boolean
    loadingYearly: boolean
}



export class SubscriptionInnerOptions extends React.Component<Props> {

    render() {
        return (
            <div style={styles.subscriptionOptionsContainer}>
                <SubscriptionPriceBox
                    key={'SubscriptionBoxBackupsMonthly'}
                    onClick={this.props.openCheckoutBackupMonthly}
                    title={'Monthly'}
                    price={'€2'}
                    loading={this.props.loadingMonthly}
                />
                <SubscriptionPriceBox
                    key={'SubscriptionBoxBackupsYearly'}
                    onClick={this.props.openCheckoutBackupYearly}
                    price={'€20'}
                    title={'Yearly'}
                    loading={this.props.loadingYearly}
                />
            </div>
        )
    }
}

const styles = {
    subscriptionOptionsContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '10px',
    },
}
