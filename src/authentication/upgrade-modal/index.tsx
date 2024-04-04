import React from 'react'
import Logic from './logic'
import {
    PromptTemplatesEvent,
    PromptTemplatesDependencies,
    PromptTemplatesState,
    PowerUpModalVersion,
} from './types'
import styled, { css } from 'styled-components'
import { OverlayModals } from '../../../external/@worldbrain/memex-common/ts/common-ui/components/overlay-modals'
import { UIElement } from 'ui-logic-react'
import Icon from '../../../external/@worldbrain/memex-common/ts/common-ui/components/icon'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

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

    renderAIPowerUpsOptionsList = () => {
        if (this.state.checkoutLoading === 'running') {
            return (
                <LoadingBlocker>
                    <LoadingIndicator size={40} />
                    Subscribing...
                </LoadingBlocker>
            )
        }

        return (
            <PowerUpOptions>
                {this.props.limitReachedNotif === 'AI' && (
                    <UpgradeOverlayTextContainer>
                        <UpgradeOverlayText>
                            You reached the monthly limit of 25 AI queries
                        </UpgradeOverlayText>
                        <UpgradeOverlaySubText>
                            Add the AI powerup to continue using the AI features
                        </UpgradeOverlaySubText>
                    </UpgradeOverlayTextContainer>
                )}
                <PricingSwitcher>
                    <LeftSide
                        selected={this.state.billingPeriod === 'monthly'}
                        onClick={() =>
                            this.processEvent('toggleBillingPeriod', 'monthly')
                        }
                    >
                        Monthly
                    </LeftSide>
                    <RightSide
                        selected={this.state.billingPeriod === 'yearly'}
                        onClick={() =>
                            this.processEvent('toggleBillingPeriod', 'yearly')
                        }
                    >
                        Yearly
                    </RightSide>
                </PricingSwitcher>
                <PowerUpItem>
                    <PowerUpTitleBox>
                        <PowerUpTitle>Basic</PowerUpTitle>
                        <PowerUpSubTitle>
                            25 queries per month with Claude-3-Haiku and
                            GPT-3.5-Turbo
                        </PowerUpSubTitle>
                    </PowerUpTitleBox>
                    <PowerUpPricing>Free</PowerUpPricing>
                </PowerUpItem>
                <PowerUpItem
                    onClick={() =>
                        this.processEvent('processCheckoutOpen', 'AIpowerup')
                    }
                    activated={
                        this.state.activatedPowerUps &&
                        this.state.activatedPowerUps['AIpowerup'] === true
                    }
                >
                    <PowerUpTitleBox>
                        <PowerUpTitle>Pro</PowerUpTitle>
                        <PowerUpSubTitle>
                            Unlimited queries with Claude-3-Haiku and
                            GPT-3.5-Turbo, <br />
                            and GPT-4 with own key
                        </PowerUpSubTitle>
                    </PowerUpTitleBox>
                    <PowerUpPricing>
                        {this.state.billingPeriod === 'monthly' ? '$6' : '$60'}
                    </PowerUpPricing>
                </PowerUpItem>
                <PowerUpItem
                    onClick={() =>
                        this.processEvent(
                            'processCheckoutOpen',
                            'AIpowerupOwnKey',
                        )
                    }
                    activated={
                        this.state.activatedPowerUps &&
                        this.state.activatedPowerUps['AIpowerupOwnKey'] === true
                    }
                >
                    <PowerUpTitleBox>
                        <PowerUpTitle>
                            Bring your own Key
                            <DiscountPill>60% off</DiscountPill>
                        </PowerUpTitle>
                        <PowerUpSubTitle>
                            Unlimited queries with GPT-3.5 and GPT-4,
                            <br /> at your own cost of the OpenAI API.
                        </PowerUpSubTitle>
                    </PowerUpTitleBox>
                    <PowerUpPricing>
                        {this.state.billingPeriod === 'monthly'
                            ? '$2.50'
                            : '$20'}
                    </PowerUpPricing>
                </PowerUpItem>
            </PowerUpOptions>
        )
    }
    renderBookmarkPowerUpsOptionsList = () => {
        if (
            this.state.checkoutLoading === 'running' ||
            this.state.authLoadState === 'running'
        ) {
            return (
                <LoadingBlocker>
                    <LoadingIndicator size={40} />
                    {this.state.checkoutLoading === 'running' &&
                        'Subscribing...'}
                </LoadingBlocker>
            )
        }

        console.log('this.state.', this.state.activatedPowerUps)
        return (
            <PowerUpOptions>
                {this.props.limitReachedNotif === 'Bookmarks' && (
                    <UpgradeOverlayTextContainer>
                        <UpgradeOverlayText>
                            You reached the monthly limit of 25 saved pages
                        </UpgradeOverlayText>
                        <UpgradeOverlaySubText>
                            Add the bookmarking powerup to continue saving,
                            annotating and organising
                        </UpgradeOverlaySubText>
                    </UpgradeOverlayTextContainer>
                )}
                <PricingSwitcher>
                    <LeftSide
                        selected={this.state.billingPeriod === 'monthly'}
                        onClick={() =>
                            this.processEvent('toggleBillingPeriod', 'monthly')
                        }
                    >
                        Monthly
                    </LeftSide>
                    <RightSide
                        selected={this.state.billingPeriod === 'yearly'}
                        onClick={() =>
                            this.processEvent('toggleBillingPeriod', 'yearly')
                        }
                    >
                        Yearly
                    </RightSide>
                </PricingSwitcher>
                <PowerUpItem
                    onClick={() => {
                        if (
                            this.state.activatedPowerUps &&
                            this.state.activatedPowerUps.bookmarksPowerUp ===
                                true
                        ) {
                            this.processEvent(
                                'processCheckoutOpen',
                                'bookmarksPowerUp',
                            )
                        }
                    }}
                    activated={
                        this.state.activatedPowerUps &&
                        this.state.activatedPowerUps.bookmarksPowerUp === false
                    }
                >
                    <PowerUpTitleBox>
                        <PowerUpTitle>Basic</PowerUpTitle>
                        <PowerUpSubTitle>
                            25 uniquely new pages per month. <br /> Every page
                            saved, annotated or added to a Space counts once,
                            forever.
                        </PowerUpSubTitle>
                    </PowerUpTitleBox>
                    <PowerUpPricing>Free</PowerUpPricing>
                </PowerUpItem>
                <PowerUpItem
                    onClick={() => {
                        if (
                            this.state.activatedPowerUps &&
                            this.state.activatedPowerUps.bookmarksPowerUp ===
                                false
                        ) {
                            this.processEvent(
                                'processCheckoutOpen',
                                'bookmarksPowerUp',
                            )
                        }
                    }}
                    activated={
                        this.state.activatedPowerUps &&
                        this.state.activatedPowerUps.bookmarksPowerUp === true
                    }
                >
                    <PowerUpTitleBox>
                        <PowerUpTitle>Pro</PowerUpTitle>
                        <PowerUpSubTitle>
                            Unlimited saved pages, annotations and images
                        </PowerUpSubTitle>
                    </PowerUpTitleBox>
                    <PowerUpPricing>
                        {this.state.billingPeriod === 'monthly' ? '$6' : '$60'}
                    </PowerUpPricing>
                </PowerUpItem>
            </PowerUpOptions>
        )
    }

    render() {
        let modalToShow = null

        if (this.state.powerUpType === 'Bookmarks') {
            modalToShow = this.renderBookmarkPowerUpsOptionsList()
        } else {
            modalToShow = this.renderAIPowerUpsOptionsList()
        }

        if (this.state.componentVariant === 'Modal') {
            return (
                <OverlayModals
                    getPortalRoot={this.props.getRootElement}
                    positioning="centerCenter"
                    blockedBackground
                    closeComponent={this.props.closeComponent}
                >
                    <OverlayContainer>
                        <SideBar>
                            <SidebarTitle>Powerups</SidebarTitle>
                            {Powerups.map((powerUp) => (
                                <SidebarItem
                                    onClick={() => {
                                        this.processEvent(
                                            'changeModalType',
                                            powerUp.id as PowerUpModalVersion,
                                        )
                                    }}
                                    selected={
                                        powerUp.id === this.state.powerUpType
                                    }
                                >
                                    <Icon
                                        icon={powerUp.icon}
                                        heightAndWidth="18px"
                                        color="greyScale6"
                                        hoverOff
                                    />
                                    {powerUp.title}
                                </SidebarItem>
                            ))}
                            <SidebarBottomArea>
                                {this.state.authLoadState === 'running' ? (
                                    <LoadingIndicator size={20} />
                                ) : (
                                    this.state.activatedPowerUps != null && (
                                        <PrimaryAction
                                            label="Manage Subscription"
                                            type="naked"
                                            size="medium"
                                            onClick={() => {
                                                const isStaging =
                                                    process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes(
                                                        'staging',
                                                    ) ||
                                                    process.env.NODE_ENV ===
                                                        'development'
                                                window.open(
                                                    isStaging
                                                        ? `https://billing.stripe.com/p/login/test_bIY036ggb10LeqYeUU?prefilled_email=${this.state.userEmail}`
                                                        : `https://billing.stripe.com/p/login/8wM015dIp6uPdb2288?prefilled_email=${this.state.userEmail}`,
                                                    '_blank',
                                                )
                                            }}
                                            width="100%"
                                        />
                                    )
                                )}
                            </SidebarBottomArea>
                        </SideBar>
                        <UpgradeContainer>
                            {modalToShow}{' '}
                            <MoneyBackContainer>
                                <Icon
                                    filePath="reload"
                                    heightAndWidth="20px"
                                    color="greyScale7"
                                    hoverOff
                                />
                                60-day money back guarantee
                            </MoneyBackContainer>
                        </UpgradeContainer>
                    </OverlayContainer>
                </OverlayModals>
            )
        } else {
            return modalToShow
        }
    }
}

const Powerups = [
    {
        id: 'Bookmarks',
        title: 'Bookmarking',
        icon: 'heartEmpty',
    },
    {
        id: 'AI',
        title: 'AI Features',
        icon: 'feed',
    },
]

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
    background: ${(props) => props.theme.colors.black};
    width: 650px;
`

const OverlayContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    height: 470px;
    background: ${(props) => props.theme.colors.black};
    border-radius: 10px;
    box-shadow: ${(props) => props.theme.borderStyles.boxShadowHoverElements};
    box-sizing: border-box;
`

const PowerUpOptions = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    grid-gap: 2px;
    padding: 40px;
    width: 650px;
    box-sizing: border-box;
`

const PowerUpItem = styled.div<{
    activated?: boolean
}>`
    display: flex;
    align-items: center;
    padding: 15px;
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
    grid-gap: 10px;
    border-radius: 8px;

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale3};
        cursor: pointer;
    }
    ${(props) =>
        props.activated &&
        css`
            border: 1px solid ${(props) => props.theme.colors.prime1};
            position: relative;
            &::after {
                content: 'active';
                background-color: ${(props) => props.theme.colors.prime1};
                border-radius: 5px;
                position: absolute;
                bottom: -12px;
                right: 20px;
                height: 24px;
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
    width: 100%;
    display: flex;
    align-items: center;
`

const PowerUpSubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    text-align: left;
    width: 100%;
    font-size: 13px;
`
const PowerUpPricing = styled.div`
    color: ${(props) => props.theme.colors.prime1};
    font-size: 18px;
    font-weight: 700;
    min-width: 60px;
    text-align: right;
`

const PricingSwitcher = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    margin-bottom: 10px;
    margin-top: 20px;
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
`

const DiscountPill = styled.div`
    border-radius: 100px;
    padding: 3px 8px;
    background: ${(props) => props.theme.colors.prime1};
    color: ${(props) => props.theme.colors.black};
    font-size: 14px;
    margin-left: 10px;
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
`

const UpgradeOverlaySubText = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    text-align: center;
    justify-content: center;
`

const MoneyBackContainer = styled.div`
    width: 100%;
    padding: 20px 40px;
    border-top: 1px solid ${(props) => props.theme.colors.greyScale3};
    color: ${(props) => props.theme.colors.greyScale7};
    justify-content: center;
    display: flex;
    align-items: center;
    box-sizing: border-box;
`

const SideBar = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    padding: revert !important;
    padding: 40px 30px 30px 30px !important;
    grid-gap: 5px;
    width: 210px;
    height: 100%;
    box-sizing: border-box;
    border-right: 1px solid ${(props) => props.theme.colors.greyScale3};
    overflow: scroll;
    position: relative;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
`
const SidebarTitle = styled.div`
    background: ${(props) => props.theme.colors.headerGradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 20px;
    font-weight: 700;
    margin-left: 12px;
    margin-bottom: 5px;
`

const SidebarItem = styled.div<{
    selected?: boolean
}>`
    display: flex;

    font-size: 16px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.greyScale6};
    width: fill-available;
    text-align: left;
    grid-gap: 10px;
    min-height: 30px;
    height: fit-content;
    align-items: center;
    justify-content: flex-start;
    padding: revert !important;
    padding: 5px 10px !important;
    cursor: pointer;

    &:hover {
        cursor: pointer;
        background: ${(props) => props.theme.colors.greyScale3};
        border-radius: 5px;
    }

    ${(props) =>
        props.selected &&
        css`
            background: ${(props) => props.theme.colors.greyScale3};
            border-radius: 5px;
        `}
`

const SidebarBottomArea = styled.div`
    position: absolute;
    bottom: 20px;
`
