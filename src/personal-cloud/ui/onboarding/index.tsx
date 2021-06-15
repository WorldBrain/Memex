import React from 'react'
import styled from 'styled-components'
import { UIElement } from '@worldbrain/memex-common/lib/main-ui/classes'
import Overlay from '@worldbrain/memex-common/lib/main-ui/containers/overlay'

import CloudOnboardingModalLogic from './logic'
import type { Dependencies, State, Event } from './types'
import { PlanTier } from './types'
import CloudPricingPlans from '../components/pricing-plans'

export interface Props extends Dependencies {
    onModalClose: () => void
}

export default class CloudOnboardingModal extends UIElement<
    Props,
    State,
    Event
> {
    constructor(props: Props) {
        super(props, { logic: new CloudOnboardingModalLogic(props) })
    }

    private selectPlan = (tier: PlanTier) => () =>
        this.processEvent('selectPlan', { tier })

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={this.props.onModalClose}
            >
                <CloudPricingPlans
                    userType={
                        this.state.currentUser != null ? 'existing' : 'new'
                    }
                    tier2PaymentPeriod={this.state.tier2PaymentPeriod}
                    onTier1PlanClick={this.selectPlan(PlanTier.Explorer)}
                    onTier2PlanClick={this.selectPlan(PlanTier.Thinker)}
                    onTier3PlanClick={this.selectPlan(PlanTier.Supporter)}
                    setTier2PaymentPeriod={(period) =>
                        this.processEvent('setTier2PaymentPeriod', { period })
                    }
                />
            </Overlay>
        )
    }
}
