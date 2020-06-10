import { storiesOf } from '@storybook/react'
import React from 'react'
import SubscribeModal from 'src/authentication/components/Subscription/SubscribeModal'
import SubscriptionOptionsChargebee from 'src/authentication/components/Subscription/SubscriptionOptionsChargebee'
import { SubscriptionInnerOptions } from 'src/authentication/components/Subscription/SubscriptionInnerOptions'

storiesOf('Subscription', module)
    .add('Subscribe Modal', () => <SubscribeModal onClose={() => null} />)
    .add('Subscribe Price Box', () => (
        <SubscriptionInnerOptions
            loadingMonthly={false}
            loadingYearly={false}
            openCheckoutBackupMonthly={() => false}
            openCheckoutBackupYearly={() => false}
            openPortal={() => false}
            plans={[]}
        />
    ))
    .add('SubscriptionOptionsChargebee', () => (
        <SubscriptionOptionsChargebee
            onClose={() => null}
            onSubscriptionClicked={() => null}
            onSubscriptionOpened={() => null}
            user={null}
            plans={[]}
        />
    ))
