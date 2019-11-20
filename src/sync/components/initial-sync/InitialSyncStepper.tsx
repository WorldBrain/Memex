import React, { Component } from 'react'
import ScanQRCode from 'src/sync/components/initial-sync/ScanQRCode'
import SyncProgress from 'src/sync/components/initial-sync/SyncProgress'
import ProgressWrapper from 'src/common-ui/components/progress-step-container'

interface Props {
    onFinish: any
}

interface State {
    currentStep: number
}

export default class InitialSyncStepper extends Component<Props, State> {
    state = { currentStep: 0 }

    steps = [() => <ScanQRCode />, () => <SyncProgress />]

    render() {
        return (
            <div>
                <ProgressWrapper
                    totalSteps={this.steps.length}
                    onStepClick={() => undefined}
                />
                {this.steps[this.state.currentStep]()}
            </div>
        )
    }
}
