import React from 'react'
import styled from 'styled-components'

import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import type { PaymentPeriod } from '../types'

export interface Props {
    userType: 'existing' | 'new'
    tier2PaymentPeriod: PaymentPeriod
    onTier1PlanClick: React.MouseEventHandler
    onTier2PlanClick: React.MouseEventHandler
    onTier3PlanClick: React.MouseEventHandler
    setTier2PaymentPeriod: (period: PaymentPeriod) => void
}

export default class CloudPricingPlans extends React.PureComponent<Props> {
    private bindSetTier2PaymentPeriod = (period: PaymentPeriod) => () =>
        this.props.setTier2PaymentPeriod(period)

    private renderTier1Plan() {
        const { userType, onTier1PlanClick } = this.props

        return (
            <PlanColumn>
                <PlanHeading>Explorer</PlanHeading>
                <PlanDetails>
                    50 new blocks per month{' '}
                    <strong>Saved Websites, PDFs, Video & Annotations</strong>
                </PlanDetails>
                <PlanDetails>Across All Devices</PlanDetails>
                <PlanDetails>
                    {userType === 'existing'
                        ? 'Migrate existing Memex Data'
                        : 'Import from existing services'}
                </PlanDetails>
                <PlanDetails>Cloud Backup</PlanDetails>
                <PricingBox>
                    <PricingOption naked>
                        <PricingOptionTitle>Free</PricingOptionTitle>
                    </PricingOption>
                </PricingBox>
                <PlanBtnBox>
                    {userType === 'existing' ? (
                        <>
                            <PrimaryAction
                                label="Migrate Existing Data"
                                onClick={onTier1PlanClick}
                            />
                            <PlanBtnSubtext>
                                or download existing data locally
                            </PlanBtnSubtext>
                        </>
                    ) : (
                        <SecondaryAction
                            label={
                                <BtnLabelWrapper>
                                    <Icon
                                        icon="checkRound"
                                        height="17px"
                                        color="purple"
                                    />{' '}
                                    You're on this plan
                                </BtnLabelWrapper>
                            }
                            onClick={() => undefined}
                            disabled
                        />
                    )}
                </PlanBtnBox>
            </PlanColumn>
        )
    }

    render() {
        const { tier2PaymentPeriod } = this.props
        return (
            <Container>
                {this.renderTier1Plan()}
                <PlanColumn>
                    <PlanHeading>Thinker</PlanHeading>
                    <PlanDetails>Everything in 'Explorer' plus...</PlanDetails>
                    <PricingBox>
                        <PricingOption
                            onClick={this.bindSetTier2PaymentPeriod('monthly')}
                            selected={tier2PaymentPeriod === 'monthly'}
                            clickable
                        >
                            <PricingOptionTitle>$8</PricingOptionTitle>
                            <PricingOptionSubtext>/ month</PricingOptionSubtext>
                        </PricingOption>
                        <PricingOption
                            onClick={this.bindSetTier2PaymentPeriod('yearly')}
                            selected={tier2PaymentPeriod === 'yearly'}
                            clickable
                        >
                            <PricingOptionTitle>$88</PricingOptionTitle>
                            <PricingOptionSubtext>/ year</PricingOptionSubtext>
                        </PricingOption>
                    </PricingBox>
                    <PlanBtnBox>
                        <PrimaryAction
                            label="Start Free Trial"
                            onClick={this.props.onTier2PlanClick}
                        />
                        <PlanBtnSubtext>
                            You'll be charged after 31 days
                        </PlanBtnSubtext>
                    </PlanBtnBox>
                </PlanColumn>
                <PlanColumn>
                    <PlanHeading>Supporter</PlanHeading>
                    <PlanDetails>Always on our highest tier plans</PlanDetails>
                    <PricingBox>
                        <PricingOption>
                            <PricingOptionTitle>
                                $135 / 2 years
                            </PricingOptionTitle>
                            <PricingOptionSubtext>
                                $5.65/month, $67.50/year
                            </PricingOptionSubtext>
                        </PricingOption>
                    </PricingBox>
                    <PlanBtnBox>
                        <PrimaryAction
                            label="Join"
                            onClick={this.props.onTier3PlanClick}
                        />
                        <PlanBtnSubtext>
                            You'll be charged $135 today
                        </PlanBtnSubtext>
                    </PlanBtnBox>
                </PlanColumn>
            </Container>
        )
    }
}

const Container = styled.div`
    display: flex;
`

const PlanColumn = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const PlanHeading = styled.h1``

const PlanDetails = styled.p``

const PricingBox = styled.div`
    display: flex;
    justify-content: space-between;
`

const PricingOption = styled.div<{
    naked?: boolean
    selected?: boolean
    clickable?: boolean
}>`
    display: flex;
    flex-direction: column;
    align-items: center;
    background: ${(props) => (props.selected ? '#F0F0F0' : 'white')};
    cursor: ${(props) => (props.clickable ? 'pointer' : 'default')};
    padding: 10px;
`

const PricingOptionTitle = styled.span`
    font-size: 2em;
`

const PricingOptionSubtext = styled.span`
    font-size: 1em;
`

const PlanBtnBox = styled.div``

const PlanBtnSubtext = styled.span`
    font-size: 0.7em;
`

const BtnLabelWrapper = styled.span`
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: relative;
    min-width: 110%;
    left: -5%;
`
