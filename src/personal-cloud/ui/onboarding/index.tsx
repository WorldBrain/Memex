import React from 'react'
import styled from 'styled-components'
import { UIElement } from '@worldbrain/memex-common/lib/main-ui/classes'
import Overlay from '@worldbrain/memex-common/lib/main-ui/containers/overlay'

import CloudOnboardingModalLogic from './logic'
import type { Dependencies, State, Event } from './types'
import { PlanTier } from './types'
import CloudPricingPlans from '../components/pricing-plans'
import DataMigrator from '../components/data-migrator'
import DataDumper from '../components/data-dumper'

export interface Props extends Dependencies {
    supportLink: string
}

export default class CloudOnboardingModal extends UIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<Props, 'supportLink'> = {
        supportLink: 'mailto:support@worldbrain.io',
    }

    constructor(props: Props) {
        super(props, { logic: new CloudOnboardingModalLogic(props) })
    }

    private selectPlan = (tier: PlanTier) => () =>
        this.processEvent('selectPlan', { tier })

    private renderModalContent() {
        if (this.state.stage === 'pick-plan') {
            return (
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
            )
        }
        if (this.state.stage === 'data-dump') {
            return (
                <DataDumper
                    supportLink={this.props.supportLink}
                    backupState={this.state.backupState}
                    dataCleaningState={this.state.dataCleaningState}
                    onBackupClick={() =>
                        this.processEvent('startDataDump', null)
                    }
                    onRetryBackupClick={() =>
                        this.processEvent('retryDataDump', null)
                    }
                    onCancelBackupClick={() =>
                        this.processEvent('cancelDataDump', null)
                    }
                    onContinueClick={() =>
                        this.processEvent('continueToMigration', null)
                    }
                    onRetryCleanClick={() =>
                        this.processEvent('retryDataClean', null)
                    }
                    onCancelCleanClick={() =>
                        this.processEvent('cancelDataClean', null)
                    }
                />
            )
        }
        return (
            <DataMigrator
                supportLink={this.props.supportLink}
                migrationState={this.state.migrationState}
                onRetryMigrationClick={() =>
                    this.processEvent('retryDataMigration', null)
                }
                onCancelMigrationClick={() =>
                    this.processEvent('cancelDataMigration', null)
                }
                onFinishMigrationClick={() =>
                    this.processEvent('finishMigration', null)
                }
            />
        )
    }

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={this.props.onModalClose}
            >
                {this.renderModalContent()}
            </Overlay>
        )
    }
}
