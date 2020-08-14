import * as React from 'react'
import {
    SubscriptionCheckoutOptions,
    UserPlan,
} from '@worldbrain/memex-common/lib/subscriptions/types'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import {
    SubscriptionOptionsContainer,
    PricingGrid,
    PricingGridCheck,
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
    LinkSpan,
} from 'src/authentication/components/Subscription/pricing.style'
import { PrimaryButton } from 'src/common-ui/components/primary-button'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { AuthContextInterface } from 'src/authentication/background/types'

interface Props extends AuthContextInterface {
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
    loadingPortal: boolean
}
type Term = 'monthly' | 'annual'
interface State {
    pioneerDonationAmount: number
    term: Term
    plan: string
}

export class SubscriptionInnerOptions extends React.Component<Props, State> {
    state = {
        pioneerDonationAmount: 5,
        term: 'monthly' as Term,
        plan: null,
    }

    async componentDidMount() {
        if (
            await this.props.currentUser?.authorizedPlans?.includes(
                'pro-yearly',
            )
        ) {
            this.setState({ term: 'annual', pioneerDonationAmount: 50 })
        }

        if (
            await this.props.currentUser?.authorizedFeatures?.includes('beta')
        ) {
            this.setState({ plan: 'beta' })
        } else if (
            (await this.props.currentUser?.authorizedPlans?.includes(
                'pro-monthly',
            )) ||
            (await this.props.currentUser?.authorizedPlans?.includes(
                'pro-yearly',
            ))
        ) {
            this.setState({ plan: 'pro' })
        }
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
        if (this.state.term === 'monthly') {
            this.props.openCheckoutBackupMonthly()
        } else {
            this.props.openCheckoutBackupYearly()
        }
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
            <SubscriptionOptionsContainer>
                <TimeButtonBox>
                    <TimeButtonLeft
                        active={this.state.term === 'monthly'}
                        onClick={this.toggleMonthly}
                    >
                        Monthly
                    </TimeButtonLeft>
                    <TimeButtonRight
                        active={this.state.term === 'annual'}
                        onClick={this.toggleAnnual}
                    >
                        Yearly
                    </TimeButtonRight>
                </TimeButtonBox>
                <PricingGrid>
                    <PricingGridPlanSpacer />
                    <PricingGridPlanTitle> Explorer </PricingGridPlanTitle>

                    {this.props.currentUser?.authorizedPlans?.includes(
                        'pro-monthly',
                    ) ||
                    this.props.currentUser?.authorizedPlans?.includes(
                        'pro-yearly',
                    ) ? (
                        <PricingGridPlanTitle
                            active={this.state.plan === 'pro'}
                        >
                            {' '}
                            Thinker{' '}
                        </PricingGridPlanTitle>
                    ) : (
                        <PricingGridPlanTitle> Thinker </PricingGridPlanTitle>
                    )}
                    {this.props.currentUser?.authorizedFeatures?.includes(
                        'beta',
                    ) ? (
                        <PricingGridPlanTitle
                            active={this.state.plan === 'beta'}
                        >
                            {' '}
                            Pioneer{' '}
                        </PricingGridPlanTitle>
                    ) : (
                        <PricingGridPlanTitle> Pioneer </PricingGridPlanTitle>
                    )}

                    <PricingGridFeatureDescription>
                        Search, Organise and Annotate
                    </PricingGridFeatureDescription>
                    <ColExplorer>
                        {' '}
                        <PricingGridCheck />{' '}
                    </ColExplorer>
                    <ColThinker>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'pro'}
                        />{' '}
                    </ColThinker>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'beta'}
                        />{' '}
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
                        <PricingGridCheck
                            active={this.state.plan === 'pro'}
                        />{' '}
                    </ColThinker>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'beta'}
                        />{' '}
                    </ColPioneer>
                    <Line />

                    <PricingGridFeatureDescription>
                        Sync between mobile and desktop
                    </PricingGridFeatureDescription>
                    <ColThinker>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'pro'}
                        />{' '}
                    </ColThinker>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'beta'}
                        />{' '}
                    </ColPioneer>
                    <Line />

                    <PricingGridFeatureDescription>
                        Automatic backup to your favorite cloud
                    </PricingGridFeatureDescription>
                    <ColThinker>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'pro'}
                        />{' '}
                    </ColThinker>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'beta'}
                        />{' '}
                    </ColPioneer>
                    <Line />

                    <PricingGridFeatureDescription>
                        Early access to beta features
                    </PricingGridFeatureDescription>

                    <ColPioneer>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'beta'}
                        />{' '}
                    </ColPioneer>
                    <Line />

                    <PricingGridFeatureDescription
                        onClick={() =>
                            window.open('https://worldbrain.io/vision')
                        }
                    >
                        Support the development of an ethical business.{' '}
                        <LinkSpan>Learn more</LinkSpan>
                    </PricingGridFeatureDescription>
                    <ColPioneer>
                        {' '}
                        <PricingGridCheck
                            active={this.state.plan === 'beta'}
                        />{' '}
                    </ColPioneer>

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
                        {this.props.loadingMonthly ||
                        this.props.loadingYearly ||
                        this.props.loadingPortal ? (
                            <PrimaryButton onClick={null}>
                                <LoadingIndicator />
                            </PrimaryButton>
                        ) : (
                            <div>
                                {this.state.plan !== 'pro' ? (
                                    <PrimaryButton onClick={this.openCheckout}>
                                        Upgrade
                                    </PrimaryButton>
                                ) : (
                                    <div>
                                        {this.state.term === 'annual' &&
                                        this.props.currentUser?.authorizedPlans?.includes(
                                            'pro-monthly',
                                        ) ? (
                                            <PrimaryButton
                                                onClick={this.openCheckout}
                                            >
                                                Upgrade
                                            </PrimaryButton>
                                        ) : (
                                            <PrimaryButton
                                                onClick={this.props.openPortal}
                                            >
                                                Edit
                                            </PrimaryButton>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </ColThinker>
                    <ColPioneer>
                        {this.props.loadingMonthly ||
                        this.props.loadingYearly ||
                        this.props.loadingPortal ? (
                            <PrimaryButton onClick={null}>
                                <LoadingIndicator />
                            </PrimaryButton>
                        ) : (
                            <div>
                                {this.state.plan !== 'beta' ? (
                                    <PrimaryButton
                                        onClick={this.openCheckoutPioneer}
                                    >
                                        Upgrade
                                    </PrimaryButton>
                                ) : (
                                    <div>
                                        {this.state.term === 'annual' &&
                                        this.props.currentUser?.authorizedPlans?.includes(
                                            'pro-monthly',
                                        ) ? (
                                            <PrimaryButton
                                                onClick={
                                                    this.openCheckoutPioneer
                                                }
                                            >
                                                Upgrade
                                            </PrimaryButton>
                                        ) : (
                                            <PrimaryButton
                                                onClick={this.props.openPortal}
                                            >
                                                Edit
                                            </PrimaryButton>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </ColPioneer>
                </PricingGrid>
            </SubscriptionOptionsContainer>
        )
    }
}

export default withCurrentUser(SubscriptionInnerOptions)
