import React from 'react'
import { UIElement } from '@worldbrain/memex-common/lib/main-ui/classes'
import Overlay from '@worldbrain/memex-common/lib/main-ui/containers/overlay'

import CloudOnboardingModalLogic from './logic'
import type { Dependencies, State, Event } from './types'
import DataMigrator from '../components/data-migrator'
import DataCleaner from '../components/data-cleaner'
import DataDumper from '../components/data-dumper'

export interface Props extends Dependencies {
    supportLink: string
    dataCleanReadMoreLink: string
}

export default class CloudOnboardingModal extends UIElement<
    Props,
    State,
    Event
> {
    static defaultProps: Pick<
        Props,
        'supportLink' | 'dataCleanReadMoreLink'
    > = {
        supportLink: 'mailto:support@worldbrain.io',
        dataCleanReadMoreLink: 'https://getmemex.com', // TODO: fix this
    }

    constructor(props: Props) {
        super(props, { logic: new CloudOnboardingModalLogic(props) })
    }

    private renderModalContent() {
        if (this.state.stage === 'data-dump') {
            return (
                <DataDumper
                    supportLink={this.props.supportLink}
                    backupState={this.state.backupState}
                    onStartClick={() =>
                        this.processEvent('startDataDump', null)
                    }
                    onRetryClick={() =>
                        this.processEvent('retryDataDump', null)
                    }
                    onCancelClick={() =>
                        this.processEvent('cancelDataDump', null)
                    }
                    onContinueClick={() =>
                        this.processEvent('continueToMigration', null)
                    }
                    onUseOldVersionClick={() =>
                        this.processEvent('cancelMigrateToOldVersion', null)
                    }
                />
            )
        }
        if (this.state.stage === 'data-clean') {
            return (
                <DataCleaner
                    supportLink={this.props.supportLink}
                    readMoreLink={this.props.dataCleanReadMoreLink}
                    dataCleaningState={this.state.dataCleaningState}
                    onStartClick={() =>
                        this.processEvent('startDataClean', null)
                    }
                    onRetryClick={() =>
                        this.processEvent('retryDataClean', null)
                    }
                    onCancelClick={() =>
                        this.processEvent('cancelDataClean', null)
                    }
                />
            )
        }
        return (
            <DataMigrator
                supportLink={this.props.supportLink}
                migrationState={this.state.migrationState}
                isPrepping={!this.state.isMigrationPrepped}
                onRetryClick={() => this.processEvent('retryMigration', null)}
                onCloseClick={() => this.processEvent('closeMigration', null)}
                onCancelClick={() => this.processEvent('cancelMigration', null)}
            />
        )
    }

    render() {
        return (
            <Overlay
                services={this.props.services}
                onCloseRequested={this.props.onModalClose} // TODO: disallow this during important stuff
            >
                {this.renderModalContent()}
            </Overlay>
        )
    }
}
