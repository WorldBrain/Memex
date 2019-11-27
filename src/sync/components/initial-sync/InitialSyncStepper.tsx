import React, { Component } from 'react'
import SyncProgress from 'src/sync/components/initial-sync/SyncProgress'
import ProgressWrapper from 'src/common-ui/components/progress-step-container'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import QRCanvas from 'src/common-ui/components/qr-canvas'

interface Props {
    onFinish: any
    getInitialSyncMessage: () => Promise<string>
    waitForInitialSync: () => Promise<void>
}

interface State {
    currentStep: number
    initialSyncMessage: string
}

export default class InitialSyncStepper extends Component<Props, State> {
    state = { currentStep: 0, initialSyncMessage: null }

    componentDidMount = async () => {
        const initialSyncMessage = await this.props.getInitialSyncMessage()
        console['log']('Initial sync message:', initialSyncMessage)
        this.setState({ initialSyncMessage })
        await this.props.waitForInitialSync()
        this.setState({ currentStep: 1 })
    }

    steps = [
        () => <QRCanvas toEncode={this.state.initialSyncMessage} />,
        () => <SyncProgress />,
    ]

    render() {
        if (this.state.initialSyncMessage === null) {
            return <LoadingIndicator />
        }
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
