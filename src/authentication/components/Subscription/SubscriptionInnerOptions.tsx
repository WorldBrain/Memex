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
    PriceBox,
    TimeButtonRight,
    TimeButtonLeft,
    TimeButtonBox,
} from 'src/authentication/components/Subscription/pricing.style'
import { TypographyBodyBold } from 'src/common-ui/components/design-library/typography'
import { PrimaryButton } from 'src/common-ui/components/primary-button'

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
type Term = 'monthly' | 'annual'
interface State {
    pioneerDonationAmount: number
    term: Term
}

export class SubscriptionInnerOptions extends React.Component<Props, State> {
    state = {
        pioneerDonationAmount: 5,
        term: 'monthly' as Term,
    }

    openCheckoutPioneer = () => {
        const options = {
            pioneerDonationAmount: this.state.pioneerDonationAmount,
        }
        if (this.state.term === 'monthly') {
            this.props.openCheckoutBackupMonthly(options)
        } else {
            this.props.openCheckoutBackupYearly(options)
        }
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

    toggleMonthly = (e) => {
        this.setState({ term: 'monthly', pioneerDonationAmount: 5 })
    }

    toggleAnnual = (e) => {
        this.setState({ term: 'annual', pioneerDonationAmount: 50 })
    }

    render() {
        return (
            <div style={styles.subscriptionOptionsContainer}>
                <TimeButtonBox>
                    <TimeButtonLeft  active={this.state.term === 'monthly'} onClick={this.toggleMonthly}>Monthly</TimeButtonLeft>
                    <TimeButtonRight active={this.state.term === 'annual'} onClick={this.toggleAnnual}>Yearly</TimeButtonRight>
                </TimeButtonBox>
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
                        <PriceBox>
                            <PriceText>
                                {this.state.term === 'monthly' ? '3' : '30'}€
                            </PriceText>
                        </PriceBox>
                    </ColThinker>

                    <ColPioneer>
                        <PriceBox>
                            <PriceText>
                                {this.state.term === 'monthly' ? '3' : '30'} +{' '}
                            </PriceText>

                            {this.state.term === 'monthly' ? (
                                <PriceInputBox
                                    onChange={this.pioneerDonationChanged}
                                    size={1}
                                >
                                    <option value={5}>5</option>
                                    <option value={8}>8</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={50}>50</option>
                                </PriceInputBox>
                            ) : (
                                <PriceInputBox
                                    onChange={this.pioneerDonationChanged}
                                    size={1}
                                >
                                    <option value={50}>50</option>
                                    <option value={80}>80</option>
                                    <option value={100}>100</option>
                                    <option value={150}>150</option>
                                    <option value={500}>500</option>
                                </PriceInputBox>
                            )}
                            <PriceText>€</PriceText>
                        </PriceBox>
                    </ColPioneer>

                    <ColThinker>
                        <PrimaryButton onClick={this.openCheckout}>
                            Upgrade
                        </PrimaryButton>
                    
                    </ColThinker>

                    <ColPioneer>
                        <PrimaryButton onClick={this.openCheckoutPioneer}>
                            Upgrade
                        </PrimaryButton>
                    </ColPioneer>
                </PricingGrid>
            </div>
        )
    }
}
const PricingGridCheck = () => <TypographyBodyBold>✓</TypographyBodyBold>

const styles = {
    subscriptionOptionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
}
