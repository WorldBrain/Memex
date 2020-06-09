import * as React from 'react'
import {
    SubscriptionCheckoutOptions,
    UserPlan,
} from '@worldbrain/memex-common/lib/subscriptions/types'
import {
    PricingGrid,
    PricingGridPlanSpacer,
    PricingGridPlanTitle,
    PricingGridFeatureDescription,
    Line,
    ColThinker,
    ColPioneer,
    ColExplorer,
    PriceInputBox,
    PriceText,
} from 'src/authentication/components/Subscription/pricing.style'
import { TypographyBodyBold } from 'src/common-ui/components/design-library/typography'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

interface Props {
    openCheckoutBackupMonthly?: (
        options?: Omit<SubscriptionCheckoutOptions, 'planId'>,
    ) => void
    openCheckoutBackupYearly?: (
        options?: Omit<SubscriptionCheckoutOptions, 'planId'>,
    ) => void
    openPortal?: () => void
    plans?: UserPlan[]
    loadingMonthly: boolean
    loadingYearly: boolean
}

interface State {
    pioneerDonationAmount: number
}

export class SubscriptionInnerOptions extends React.Component<Props, State> {
    state = {
        pioneerDonationAmount: 5,
    }

    openCheckoutpioneer = () => {
        this.props.openCheckoutBackupMonthly({
            pioneerDonationAmount: this.state.pioneerDonationAmount,
        })
    }

    openCheckout = () => {
        // todo show loading state
        this.props.openCheckoutBackupMonthly()
    }

    pioneerDonationChanged = (e) => {
        this.setState({
            pioneerDonationAmount: Math.max(
                parseInt(e.target.value, 10) ?? 1,
                1,
            ),
        })
    }

    render() {
        return (
            <div style={styles.subscriptionOptionsContainer}>
                <PricingGrid>
                    <PricingGridPlanSpacer />
                    <PricingGridPlanTitle> Explorer </PricingGridPlanTitle>
                    <PricingGridPlanTitle> Thinker </PricingGridPlanTitle>
                    <PricingGridPlanTitle> Pioneer </PricingGridPlanTitle>
                    <Line />

                    <PricingGridFeatureDescription>
                        Search, Organise and Annotate
                    </PricingGridFeatureDescription>
                    <ColExplorer>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColExplorer>
                    <ColThinker>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColThinker>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColPioneer>
                    <Line />

                    <PricingGridFeatureDescription>
                        Mobile App for iOS and Android
                    </PricingGridFeatureDescription>
                    <ColExplorer>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColExplorer>
                    <ColThinker>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColThinker>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColPioneer>
                    <Line />

                    <PricingGridFeatureDescription>
                        Sync between mobile and desktop
                    </PricingGridFeatureDescription>
                    <ColThinker>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColThinker>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColPioneer>
                    <Line />

                    <PricingGridFeatureDescription>
                        Early access to beta features
                    </PricingGridFeatureDescription>

                    <ColPioneer>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColPioneer>
                    <Line />

                    <PricingGridFeatureDescription>
                        Support the development of an ethical business
                    </PricingGridFeatureDescription>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColPioneer>
                    <Line />

                    <ColExplorer>
                        <PriceText> Free</PriceText>
                    </ColExplorer>

                    <ColThinker>
                        <PriceText>2€</PriceText>
                        <PrimaryButton onClick={this.openCheckout}>
                            Upgrade
                        </PrimaryButton>
                    </ColThinker>

                    <ColPioneer>
                        <PriceText>2 + </PriceText>
                        <PriceInputBox
                            value={this.state.pioneerDonationAmount}
                            onChange={this.pioneerDonationChanged}
                            size={1}
                        />
                        <PriceText>€</PriceText>

                        <PrimaryButton onClick={this.openCheckoutpioneer}>
                            Upgrade
                        </PrimaryButton>
                    </ColPioneer>
                </PricingGrid>

                {/*<SubscriptionPriceBox*/}
                {/*    key={'SubscriptionBoxBackupsMonthly'}*/}
                {/*    onClick={this.props.openCheckoutBackupMonthly}*/}
                {/*    title={'Monthly'}*/}
                {/*    price={'€2'}*/}
                {/*    loading={this.props.loadingMonthly}*/}
                {/*/>*/}
                {/*<SubscriptionPriceBox*/}
                {/*    key={'SubscriptionBoxBackupsYearly'}*/}
                {/*    onClick={this.props.openCheckoutBackupYearly}*/}
                {/*    price={'€20'}*/}
                {/*    title={'Yearly'}*/}
                {/*    loading={this.props.loadingYearly}*/}
                {/*/>*/}
            </div>
        )
    }
}
const PricingGridCheck = () => <TypographyBodyBold>✓</TypographyBodyBold>

const styles = {
    subscriptionOptionsContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '10px',
    },
}
