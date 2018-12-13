import React from 'react'
import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
const localStyles = require('./running-process.css')
import { ProgressBar } from '../components/progress-bar'
import MovingDotsLabel from '../components/moving-dots-label'
import { PrimaryButton } from '../components/primary-button'
import LoadingBlocker from '../components/loading-blocker'
const STYLES = require('../styles.css')

interface Props {
    functionNames: {
        info: string
        start: string
        cancel: string
        pause: string
        resume: string
    }
    eventMessageName: string
    preparingStepLabel: string
    synchingStepLabel: string
    renderHeader: () => any
    renderFailMessage: () => any
    renderSuccessMessage: () => any
    onFinish: () => void
}

export default class RunningProcess extends React.Component<Props> {
    state = { status: null, info: null, canceling: false }

    async componentDidMount() {
        window['browser'].runtime.onMessage.addListener(this.messageListener)

        const info = await remoteFunction(this.props.functionNames.info)()
        if (info) {
            this.setState({
                status: 'running',
                info,
            })
        } else {
            this.setState({
                status: 'running',
                info: { state: 'preparing' },
            })
            await remoteFunction(this.props.functionNames.start)()
        }

        // this.setState({
        //     status: 'running',
        //     info: { state: 'preparing' },
        // })
        // this.setState({
        //     status: 'running',
        //     info: { state: 'pausing', totalChanges: 1000, processedChanges: 500 },
        // })
        // this.setState({
        //     status: 'success',
        //     info: { state: 'synching', totalChanges: 1000, processedChanges: 1000 },
        // })
        // this.setState({
        //     status: 'fail',
        //     info: { state: 'synching', totalChanges: 1000, processedChanges: 10 },
        // })
    }

    componentWillUnmount() {
        window['browser'].runtime.onMessage.removeListener(this.messageListener)
    }

    messageListener = message => {
        if (message.type === this.props.eventMessageName) {
            this.handleProcessEvent(message.event)
        }
    }

    handleProcessEvent(event) {
        if (event.type === 'info') {
            this.setState({
                status: 'running',
                info: event.info || this.state.info,
            })
        } else if (event.type === 'success') {
            this.setState({ status: 'success' })
        } else if (event.type === 'fail') {
            this.setState({ status: 'fail' })
        }
    }

    handlePause() {
        const info = this.state.info
        info.state = 'pausing'
        this.setState({ info })
        remoteFunction(this.props.functionNames.pause)()
    }

    handleResume() {
        remoteFunction(this.props.functionNames.resume)()
    }

    async handleCancel() {
        this.setState({ canceling: true })
        await remoteFunction(this.props.functionNames.cancel)()
        this.props.onFinish()
    }

    renderRunning(info) {
        const progressPercentage =
            info.processedChanges && info.totalChanges
                ? info.processedChanges / info.totalChanges
                : 0

        return (
            <div>
                {this.props.renderHeader()}
                <div className={STYLES.subtitle2}>
                    You can leave this page and come back at any time.
                </div>
                <div className={localStyles.steps}>
                    {this.renderSteps(info)}
                    <ProgressBar value={progressPercentage} />
                </div>
                {this.renderActions(info)}
            </div>
        )
    }

    renderSteps(info) {
        return (
            <React.Fragment>
                <div className={localStyles.step}>
                    <div className={localStyles.stepLabel}>
                        <span className={localStyles.stepNumber}>Step 1:</span>
                        {this.props.preparingStepLabel}
                    </div>
                    <div className={localStyles.stepStatus}>
                        {info.state === 'preparing' && 'In progress'}
                        {info.state !== 'preparing' && '✔️'}
                    </div>
                </div>
                <div className={localStyles.step}>
                    <div className={localStyles.stepLabel}>
                        <span className={localStyles.stepNumber}>Step 2:</span>
                        {this.props.synchingStepLabel}
                    </div>
                    <div className={localStyles.stepStatus}>
                        {info.state === 'preparing' && 'Waiting'}
                        {status === 'running' &&
                            info.state !== 'preparing' &&
                            'In progress'}
                        {status === 'success' && '✔️'}
                    </div>
                </div>
            </React.Fragment>
        )
    }

    renderActions(info) {
        return (
            <div className={localStyles.actions}>
                {info.state !== 'paused' &&
                    info.state !== 'pausing' && (
                        <PrimaryButton
                            onClick={() => {
                                this.handlePause()
                            }}
                        >
                            Pause
                        </PrimaryButton>
                    )}
                {info.state !== 'paused' &&
                    info.state === 'pausing' && (
                        <PrimaryButton onClick={() => {}}>
                            <div style={{ width: '150px' }}>
                                <MovingDotsLabel
                                    text="Preparing pause"
                                    intervalMs={500}
                                />
                            </div>
                        </PrimaryButton>
                    )}
                {info.state === 'paused' && (
                    <PrimaryButton
                        onClick={() => {
                            this.handleResume()
                        }}
                    >
                        Resume
                    </PrimaryButton>
                )}
                {info.state !== 'paused' &&
                    info.state !== 'pausing' && (
                        <div
                            className={localStyles.actionCancel}
                            onClick={() => {
                                !this.state.canceling && this.handleCancel()
                            }}
                        >
                            {!this.state.canceling && 'Cancel'}
                            {this.state.canceling && (
                                <MovingDotsLabel
                                    text="Canceling"
                                    intervalMs={500}
                                />
                            )}
                        </div>
                    )}
            </div>
        )
    }

    renderSuccess() {
        return (
            <div className={localStyles.finish}>
                {this.props.renderSuccessMessage()}
                <PrimaryButton
                    onClick={() => {
                        this.props.onFinish()
                    }}
                >
                    Return to Settings
                </PrimaryButton>
            </div>
        )
    }

    renderFail() {
        return (
            <div className={localStyles.finish}>
                {this.props.renderFailMessage()}
                <PrimaryButton
                    onClick={() => {
                        this.props.onFinish()
                    }}
                >
                    Return to Settings
                </PrimaryButton>
            </div>
        )
    }

    render() {
        const { info, status } = this.state
        if (!info) {
            return <LoadingBlocker />
        }

        return (
            <div>
                {status === 'running' && this.renderRunning(info)}
                {status === 'success' && this.renderSuccess()}
                {status === 'fail' && this.renderFail()}
            </div>
        )
    }
}
