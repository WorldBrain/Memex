import React from 'react'
import Logic from './logic'
import {
    PromptTemplatesEvent,
    PromptTemplatesDependencies,
    PromptTemplatesState,
    PowerUpModalVersion,
} from './types'
import styled, { css, keyframes } from 'styled-components'
import { OverlayModals } from '../../../external/@worldbrain/memex-common/ts/common-ui/components/overlay-modals'
import { UIElement } from 'ui-logic-react'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { PremiumPlans } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'

const powerUps = [
    {
        id: 'bookmarksPowerUp',
        icon: 'heartEmpty',
        title: 'Research Assistant',
        subTitle: 'Bookmarking, Annotating, Organising, Sharing',
        pricing: {
            monthly: '$4',
            yearly: '$40',
        },
        pricingDiscounted: {
            monthly: '$3.20',
            yearly: '$32',
        },
    },
    {
        id: 'AIpowerup',
        icon: 'feed',
        title: 'AI Co-pilot',
        subTitle: 'Summarize & chat with YouTube, Web, PDF and Images',
        pricing: {
            monthly: '$6',
            yearly: '$60',
        },
        pricingDiscounted: {
            monthly: '$4.80',
            yearly: '$48',
        },
    },
    {
        id: 'lifetime',
        icon: 'clock',
        title: 'Lifetime All-Access',
        subTitle:
            'A transferrable lifetime plan with up to $25 in subscription value per month',
        pricing: {
            oneTime: '$450',
        },
        pricingDiscounted: {
            oneTime: '$360',
        },
    },
]

// Define the keyframes for the entrance animation
const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`

export default class UpgradeModal extends UIElement<
    PromptTemplatesDependencies,
    PromptTemplatesState,
    PromptTemplatesEvent
> {
    constructor(props: PromptTemplatesDependencies) {
        super(props, { logic: new Logic(props) })
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount()
    }

    componentDidUpdate(prevProps) {}

    async componentWillUnmount(): Promise<void> {}

    renderLifeTimePlanNote = () => {
        return (
            <LifetimeContainer>
                <UpgradeOverlayTextContainer>
                    <UpgradeOverlayText>
                        You're on the lifetime plan
                    </UpgradeOverlayText>
                    <UpgradeOverlaySubText>
                        You can use all features of Memex.
                    </UpgradeOverlaySubText>
                </UpgradeOverlayTextContainer>
            </LifetimeContainer>
        )
    }

    renderPowerUpsList = (powerUpType: PowerUpModalVersion) => {
        if (
            this.state.checkoutLoading === 'running' ||
            this.state.authLoadState === 'running'
        ) {
            return (
                <LoadingBlocker>
                    <LoadingIndicator size={40} />
                    {this.state.checkoutLoading === 'running' &&
                        'Updating Subscription...'}
                </LoadingBlocker>
            )
        }

        console.log('powerUpType', powerUpType)

        let featureString = null
        if (powerUpType === 'AI') {
            featureString = 'AI'
        } else if (powerUpType === 'Bookmarks') {
            featureString = 'Bookmarking'
        }

        return (
            <PowerUpOptions>
                <UpgradeOverlayTextContainer>
                    {this.state.remainingTrialDays <= 0 ? (
                        <UpgradeOverlayText>
                            You've reached the end of your free trial
                        </UpgradeOverlayText>
                    ) : (
                        <UpgradeOverlayText>
                            PowerUps for using Memex after the trial
                        </UpgradeOverlayText>
                    )}
                    <UpgradeOverlaySubText>
                        Add the powerup to continue using the {featureString}{' '}
                        features.
                    </UpgradeOverlaySubText>
                </UpgradeOverlayTextContainer>
                <PricingSwitcherContainer>
                    <PricingSwitcher>
                        <LeftSide
                            selected={this.state.billingPeriod === 'monthly'}
                            onClick={() =>
                                this.processEvent(
                                    'toggleBillingPeriod',
                                    'monthly',
                                )
                            }
                        >
                            Monthly
                        </LeftSide>
                        <RightSide
                            selected={this.state.billingPeriod === 'yearly'}
                            onClick={() =>
                                this.processEvent(
                                    'toggleBillingPeriod',
                                    'yearly',
                                )
                            }
                        >
                            Yearly
                        </RightSide>
                    </PricingSwitcher>
                    {this.renderManageSubscription()}
                </PricingSwitcherContainer>
                {powerUps.map((powerUp) => {
                    let activatedStatus = false
                    if (
                        this.state.activatedPowerUps?.has(
                            powerUp.id as PremiumPlans,
                        )
                    ) {
                        activatedStatus = true
                    }

                    let selectedStatus = false
                    if (
                        this.state.selectedPowerUps?.has(
                            powerUp.id as PremiumPlans,
                        )
                    ) {
                        selectedStatus = true
                    }

                    let removedStatus = false
                    if (
                        this.state.removedPowerUps?.has(
                            powerUp.id as PremiumPlans,
                        )
                    ) {
                        removedStatus = true
                    }

                    const isTrial = this.state.remainingTrialDays !== -1

                    let powerUpPricing = null
                    let originalPricing = null
                    if (this.state.billingPeriod === 'monthly') {
                        powerUpPricing = powerUp.pricing['monthly']
                        originalPricing = powerUp.pricing['monthly']
                        if (isTrial) {
                            powerUpPricing =
                                powerUp.pricingDiscounted['monthly']
                        }
                    }
                    if (this.state.billingPeriod === 'yearly') {
                        powerUpPricing = powerUp.pricing['yearly']
                        originalPricing = powerUp.pricing['yearly']
                        if (isTrial) {
                            powerUpPricing = powerUp.pricingDiscounted['yearly']
                        }
                    }
                    if (powerUp.id === 'lifetime') {
                        powerUpPricing = powerUp.pricing['oneTime']
                        originalPricing = powerUp.pricing['oneTime']
                        if (isTrial) {
                            powerUpPricing =
                                powerUp.pricingDiscounted['oneTime']
                        }
                    }
                    if (this.state.remainingTrialDays <= 0) {
                        originalPricing = null
                    }

                    return (
                        <PowerUpItem
                            onClick={() => {
                                if (selectedStatus) {
                                    this.processEvent('unSelectPowerUps', {
                                        plan: powerUp.id as PremiumPlans,
                                    })
                                } else {
                                    this.processEvent('selectPowerUps', {
                                        plan: powerUp.id as PremiumPlans,
                                    })
                                }
                            }}
                            activated={activatedStatus}
                            selected={selectedStatus}
                            unselected={removedStatus}
                        >
                            <PowerUpTitleBox>
                                <PowerUpTitleContainer>
                                    <PowerUpTitle>{powerUp.title}</PowerUpTitle>
                                    {powerUp.id === 'lifetime' && (
                                        <LifetimeTag>One-Time</LifetimeTag>
                                    )}
                                </PowerUpTitleContainer>
                                <PowerUpSubTitle>
                                    {powerUp.subTitle}
                                </PowerUpSubTitle>
                            </PowerUpTitleBox>
                            {activatedStatus &&
                            !(activatedStatus && !selectedStatus) ? (
                                <PrimaryAction
                                    label="Downgrade"
                                    type="tertiary"
                                    size="small"
                                    onClick={() => {
                                        null
                                    }}
                                />
                            ) : (
                                <PowerUpPricingBox>
                                    {originalPricing && (
                                        <OriginalPrice>
                                            {originalPricing}
                                        </OriginalPrice>
                                    )}
                                    <PowerUpPricing>
                                        {powerUpPricing}
                                    </PowerUpPricing>
                                </PowerUpPricingBox>
                            )}
                        </PowerUpItem>
                    )
                })}
            </PowerUpOptions>
        )
    }

    renderCheckoutFooter = () => {
        const selectedPowerUps = this.state.selectedPowerUps
        const activatedPowerUps = this.state.activatedPowerUps
        console.log('selectedPowerUps', selectedPowerUps)
        console.log('activatedPowerUps', activatedPowerUps)
        if (selectedPowerUps?.size === 0 && activatedPowerUps?.size === 0) {
            return null
        }
        if (
            selectedPowerUps?.size > 0 &&
            activatedPowerUps?.size > 0 &&
            selectedPowerUps.size === activatedPowerUps.size &&
            [...selectedPowerUps].every((item) => activatedPowerUps.has(item))
        ) {
            return null
        }

        let type: 'update' | 'upgrade' = 'upgrade'

        if (activatedPowerUps.size > 0) {
            type = 'update'
        }

        return (
            <CheckOutFooter componentVariant={this.state.componentVariant}>
                <CheckoutFooterText>
                    {type === 'update'
                        ? 'Update Subscription'
                        : 'Upgrade Selected Powerups'}
                </CheckoutFooterText>
                <PrimaryAction
                    label={type === 'update' ? 'Update' : 'Upgrade'}
                    type="primary"
                    size="medium"
                    onClick={() => {
                        this.processEvent('processCheckoutOpen', null)
                    }}
                />
            </CheckOutFooter>
        )
    }

    renderManageSubscription = () => {
        if (this.state.activatedPowerUps?.size > 0) {
            return (
                <ManageSubscriptionBox>
                    <PrimaryAction
                        label="Manage Subscription"
                        type="naked"
                        size="medium"
                        onClick={() => {
                            const isStaging =
                                process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes(
                                    'staging',
                                ) || process.env.NODE_ENV === 'development'
                            window.open(
                                isStaging
                                    ? `https://billing.stripe.com/p/login/test_bIY036ggb10LeqYeUU?prefilled_email=${this.state.userEmail}`
                                    : `https://billing.stripe.com/p/login/8wM015dIp6uPdb2288?prefilled_email=${this.state.userEmail}`,
                                '_blank',
                            )
                        }}
                        width="100%"
                    />
                </ManageSubscriptionBox>
            )
        }
    }

    render() {
        const upgradeContent = this.state.activatedPowerUps.has('lifetime') ? (
            this.renderLifeTimePlanNote()
        ) : (
            <OverlayContainer>
                <UpgradeContainer>
                    {this.state.remainingTrialDays &&
                        this.state.remainingTrialDays !== -1 && (
                            <TrialBanner
                                componentVariant={this.state.componentVariant}
                            >
                                {this.state.remainingTrialDays} trial days left.
                                Upgrade before for a 20% discount.
                            </TrialBanner>
                        )}
                    {this.renderPowerUpsList(this.state.powerUpType)}
                </UpgradeContainer>

                {this.renderCheckoutFooter()}
            </OverlayContainer>
        )

        if (this.state.componentVariant === 'Modal') {
            return (
                <OverlayModals
                    getPortalRoot={this.props.getRootElement}
                    positioning="centerCenter"
                    blockedBackground
                    closeComponent={this.props.closeComponent}
                >
                    <ModalContainer>{upgradeContent}</ModalContainer>
                </OverlayModals>
            )
        } else {
            return upgradeContent
        }
    }
}

const ModalContainer = styled.div`
    background: ${(props) => props.theme.colors.black};
    border-radius: 10px;
    box-shadow: ${(props) => props.theme.borderStyles.boxShadowHoverElements};
    width: 650px;
`

const LoadingBlocker = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 20px;
    color: ${(props) => props.theme.colors.greyScale7};
    backdrop-filter: blur(5px);
    flex: 1;
    font-size: 16px;
`

const OverlayContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    height: fit-content;
    min-height: 470px;
    box-sizing: border-box;
    border-radius: 20px;
    position: relative;
`

const PowerUpOptions = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    grid-gap: 10px;
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
`

const PowerUpItem = styled.div<{
    activated?: boolean
    selected?: boolean
    unselected?: boolean
}>`
    display: flex;
    align-items: center;
    padding: 15px;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
    grid-gap: 10px;
    border-radius: 8px;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale3};
        cursor: pointer;
    }

    ${(props) =>
        props.selected &&
        css`
            border: 1px solid ${(props) => props.theme.colors.prime2};
            position: relative;
            &::after {
                content: 'selected';
                background-color: ${(props) => props.theme.colors.prime2};
                border-radius: 0 5px 0 5px;
                position: absolute;
                top: 0px;
                right: 0px;
                height: 20px;
                font-size: 12px;
                padding: 0 5px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `}

    ${(props) =>
        props.activated &&
        css`
            border: 1px solid ${(props) => props.theme.colors.prime1};
            position: relative;
            &::after {
                content: 'active';
                background-color: ${(props) => props.theme.colors.prime1};
                border-radius: 0 5px 0 5px;
                position: absolute;
                top: 0px;
                right: 0px;
                height: 20px;
                font-size: 12px;
                padding: 0 5px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `}

  
    ${(props) =>
        props.unselected &&
        css`
            border: 1px solid ${(props) => props.theme.colors.warning};
            position: relative;
            &::after {
                content: 'Downgrading';
                background-color: ${(props) => props.theme.colors.warning};
                border-radius: 0 5px 0 5px;
                position: absolute;
                top: 0px;
                right: 0px;
                height: 20px;
                font-size: 12px;
                padding: 0 5px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `}
`

const PowerUpTitleBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    grid-gap: 5px;
`

const PowerUpTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale7};
    font-weight: 500;
    text-align: left;
    font-size: 16px;
    display: flex;
    align-items: center;
`

const PowerUpSubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    text-align: left;
    width: 100%;
    font-size: 13px;
`

const PowerUpPricingBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    grid-gap: 3px;
    align-items: flex-end;
`

const PowerUpPricing = styled.div<{
    componentVariant?: string
}>`
    color: ${(props) => props.theme.colors.prime1};
    font-size: 18px;
    font-weight: 700;
    min-width: 60px;
    text-align: right;

    ${(props) =>
        props.componentVariant === 'OnboardingStep' &&
        css`
            text-decoration: line-through;
            color: ${(props) => props.theme.colors.greyScale5};
            font-size: 15px;
        `}
`
const AlternativePricing = styled.div<{
    componentVariant?: string
}>`
    color: ${(props) => props.theme.colors.prime1};
    font-size: 18px;
    font-weight: 700;
    min-width: 60px;
    text-align: right;
`

const PricingSwitcherContainer = styled.div`
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
`

const PricingSwitcher = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    margin-bottom: 10px;
    margin-top: 10px;
`

const LeftSide = styled.div<{ selected: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    padding: 0 10px;
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale6};
    cursor: pointer;

    ${(props) =>
        props.selected &&
        css`
            background: ${(props) => props.theme.colors.greyScale3};
        `}
`

const RightSide = styled.div<{ selected: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    padding: 0 10px;
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale6};
    cursor: pointer;

    ${(props) =>
        props.selected &&
        css`
            background: ${(props) => props.theme.colors.greyScale3};
        `}
`

const UpgradeContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-direction: column;
    height: fill-available;
    width: 100%;
    min-height: inherit;
`

const UpgradeOverlayText = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 20px;
    font-weight: 700;
    text-align: center;
    justify-content: center;
`

const UpgradeOverlayTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    margin-bottom: 10px;
    margin-top: 10px;
    width: 100%;
`

const UpgradeOverlaySubText = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    text-align: center;
    justify-content: center;
`

const TrialBanner = styled.div<{
    componentVariant: 'Modal' | 'PricingList' | 'AccountPage' | 'OnboardingStep'
}>`
    background: ${(props) => props.theme.colors.warning}40;
    padding: 10px;
    width: fill-available;
    text-align: center;
    font-size: 14px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    align-items: center;
    justify-content: center;

    ${(props) =>
        (props.componentVariant === 'OnboardingStep' ||
            props.componentVariant === 'AccountPage') &&
        css`
            border-radius: 10px;
        `}
`

const PowerUpTitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    gap: 15px;
`

const LifetimeTag = styled.div`
    background: ${(props) => props.theme.colors.prime2};
    padding: 2px 8px;
    border-radius: 5px;
    color: ${(props) => props.theme.colors.black};
    font-size: 13px;
`

const CheckOutFooter = styled.div<{
    componentVariant: 'Modal' | 'PricingList' | 'AccountPage' | 'OnboardingStep'
}>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: fill-available;
    width: -moz-available;
    transform: translateY(-20px);
    transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
    animation: ${fadeInUp} 0.2s ease-in-out forwards;
    padding: 20px 30px;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    box-sizing: border-box;
    background-color: ${(props) => props.theme.colors.greyScale3};

    ${(props) =>
        (props.componentVariant === 'OnboardingStep' ||
            props.componentVariant === 'AccountPage') &&
        css`
            border-radius: 15px;
            margin: 0px 20px 20px 20px;
        `}
`
const CheckoutFooterText = styled.div`
    font-size: 16px;
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`

const OriginalPrice = styled.div`
    color: ${(props) => props.theme.colors.greyScale7};
    font-size: 16px;
    font-weight: 400;
    text-decoration: line-through;
`

const LifetimeContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 300px;
    background: ${(props) => props.theme.colors.greyScale2};
    border-radius: 10px;
    padding: 20px;
    box-sizing: border-box;
`

const ManageSubscriptionBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    position: absolute;
    right: 0;
`
