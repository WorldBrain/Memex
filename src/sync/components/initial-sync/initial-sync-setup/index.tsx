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
import Modal from 'src/common-ui/components/Modal'

export default class InitialSyncSetup extends StatefulUIElement<
    InitialSyncSetupDependencies,
    InitialSyncSetupState,
    InitialSyncSetupEvent
> {
    constructor(props: InitialSyncSetupDependencies) {
        super(props, new InitialSyncSetupLogic(props))
    }

    renderInner = () => {
        switch (this.state.status) {
            case 'introduction':
                return (
                    <Introduction
                        handleStart={() => this.processEvent('start', {})}
                        handleBack={this.close}
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
                        handleCancel={() => this.processEvent('cancel', {})}
                    />
                )
            case 'done':
                return <Success onClose={this.close} />
            default:
                throw Error(`Unknown Sync Setup state ${this.state.status}`)
        }
    }

    close = () => (this.state.status === 'sync' ? false : this.props.onClose())

    render() {
        return this.props.open || this.state.status === 'sync' ? (
            <Modal large onClose={this.close}>
                {this.renderInner()}
            </Modal>
        ) : null
    }
}
