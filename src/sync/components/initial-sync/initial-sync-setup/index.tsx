import React from 'react'
import { StatefulUIElement } from 'src/util/ui-logic'
import InitialSyncSetupLogic, {
    InitialSyncSetupDependencies,
    InitialSyncSetupEvent,
    InitialSyncSetupState,
} from 'src/sync/components/initial-sync/initial-sync-setup/logic'
import { Success } from 'src/sync/components/initial-sync/initial-sync-setup/steps/Success'
import { Introduction } from 'src/sync/components/initial-sync/initial-sync-setup/steps/Introduction'
import { PairDeviceScreen } from 'src/sync/components/initial-sync/initial-sync-setup/steps/PairDeviceScreen'
import { SyncDeviceScreen } from 'src/sync/components/initial-sync/initial-sync-setup/steps/SyncDeviceScreen'

export default class InitialSyncSetup extends StatefulUIElement<
    InitialSyncSetupDependencies,
    InitialSyncSetupState,
    InitialSyncSetupEvent
> {
    constructor(props: InitialSyncSetupDependencies) {
        super(props, new InitialSyncSetupLogic(props))
    }

    render = () => {
        switch (this.state.status) {
            case 'introduction':
                return (
                    <Introduction
                        handleStart={() => this.processEvent('start', {})}
                        handleBack={this.props.onClose}
                    />
                )
            case 'pair':
                return (
                    <PairDeviceScreen
                        initialSyncMessage={this.state.initialSyncMessage}
                        onPressBack={() =>
                            this.processEvent('backToIntroduction', {})
                        }
                    />
                )
            case 'sync':
                return (
                    <SyncDeviceScreen
                        error={this.state.error}
                        progressPct={this.state.progressPct}
                        stage={this.state.stage}
                    />
                )
            case 'done':
                return <Success onClose={this.props.onClose} />
            default:
                throw Error(`Unknown Sync Setup state ${this.state.status}`)
        }
    }
}
