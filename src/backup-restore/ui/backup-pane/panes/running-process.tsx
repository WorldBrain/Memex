import React from 'react'
import { remoteFunction } from 'src/util/webextensionRPC'
import { setLocalStorageTyped } from 'src/util/storage'
const localStyles = require('./running-process.css')
import { ProgressBar } from 'src/common-ui/components'
import MovingDotsLabel from '../../../../common-ui/components/moving-dots-label'
import { PrimaryButton } from '../../../../common-ui/components/primary-button'
import LoadingBlocker from '../../../../common-ui/components/loading-blocker'
import { FailedOverlay } from '../components/overlays'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import {
    WhiteSpacer10,
    WhiteSpacer20,
    WhiteSpacer30,
} from 'src/common-ui/components/design-library/typography'

const overviewStyles = require('src/backup-restore/ui/styles.css')
const settingsStyle = require('src/options/settings/components/settings.css')
const STYLES = require('../../styles.css')

interface Props {
    functionNames: {
        info: string
        start: string
        cancel: string
        pause: string
        resume: string
        sendNotif: string
    }
    eventMessageName: string
    preparingStepLabel: string
    synchingStepLabel: string
    renderHeader: () => any
    renderFailMessage: (errorId: string) => any
    renderSuccessMessage: () => any
    onFinish: () => void
}

export default class RunningProcess extends React.Component<Props> {
    state = {
        status: null,
        info: null,
        canceling: false,
        overlay: null,
    }

    async componentDidMount() {
        window['browser'].runtime.onMessage.addListener(this.messageListener)

        const info = await remoteFunction(this.props.functionNames.info)()
        if (info) {
            this.setState({
                status: 'running',
                info,
            })
        } else {
            await this.startRestore()
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

    startRestore = async () => {
        this.setState({
            status: 'running',
            info: { state: 'preparing' },
        })
        await remoteFunction(this.props.functionNames.start)()
    }

    messageListener = message => {
        if (message.type === this.props.eventMessageName) {
            this.handleProcessEvent(message.event)
        }
    }

    async handleProcessEvent(event) {
        if (event.type === 'info') {
            this.setState({
                status: 'running',
                info: event.info || this.state.info,
            })
        } else if (event.type === 'success') {
            await setLocalStorageTyped('backup-status', {
                state: 'success',
                backupId: 'success',
            })
            this.setState({ status: 'success' })
            localStorage.setItem('progress-successful', 'true')
        } else if (event.type === 'fail') {
            const errorId = await remoteFunction(
                this.props.functionNames.sendNotif,
            )('error')
            await setLocalStorageTyped('backup-status', {
                state: 'fail',
                backupId:
                    errorId === 'backup_error' ? errorId : 'drive_size_empty',
            })
            // Set the status as fail and also update the info as to
            // what the reason of the failure was
            let overlay = null
            if (event.error === 'Backup file not found') {
                overlay = true
            }
            this.setState({
                status: 'fail',
                info: {
                    state:
                        errorId === 'backup_error'
                            ? 'network-error'
                            : 'full-drive',
                },
                overlay,
            })
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
                ? (info.processedChanges / info.totalChanges) * 100
                : 0

        return (
            <div>
                {this.props.renderHeader()}
                <WhiteSpacer10 />
                <div className={overviewStyles.showWarning}>
                    <span className={overviewStyles.WarningIcon} />
                    <span className={overviewStyles.showWarningText}>
                        With a lot of data (> 25.000 pages) it is recommended
                        running this over night.
                    </span>
                </div>
                <WhiteSpacer30 />
                <div className={localStyles.steps}>
                    {this.renderSteps(info)}
                    <ProgressBar progress={progressPercentage} />
                </div>
                <WhiteSpacer20 />
                <div className={settingsStyle.buttonArea}>
                    <div />
                    {this.renderActions(info)}
                </div>
            </div>
        )
    }

    renderSteps(info) {
        return (
            <React.Fragment>
                <div className={localStyles.step}>
                    <div className={localStyles.stepLabel}>
                        <span className={localStyles.stepNumber}>Step 1:</span>
                        <span className={settingsStyle.infoText}>
                            {this.props.preparingStepLabel}
                        </span>
                    </div>
                    <div className={localStyles.stepStatus}>
                        {info.state === 'preparing' && (
                            <span className={localStyles.statusMessageActive}>
                                running
                            </span>
                        )}
                        {info.state !== 'preparing' && (
                            <img src="/img/checkmarkGreen.svg" />
                        )}
                    </div>
                </div>
                <div className={localStyles.step}>
                    <div className={localStyles.stepLabel}>
                        <span className={localStyles.stepNumber}>Step 2:</span>
                        <span className={settingsStyle.infoText}>
                            {this.props.synchingStepLabel}
                        </span>
                    </div>
                    <div className={localStyles.stepStatus}>
                        {info.state === 'preparing' && (
                            <span className={localStyles.statusMessageWaiting}>
                                up next
                            </span>
                        )}
                        {status === 'running' && info.state !== 'preparing' && (
                            <span className={localStyles.statusMessageActive}>
                                running
                            </span>
                        )}
                        {status === 'success' && (
                            <img src="/img/checkmarkGreen.svg" />
                        )}
                    </div>
                </div>
            </React.Fragment>
        )
    }

    renderActions(info) {
        return (
            <div className={localStyles.actions}>
                {info.state !== 'paused' && info.state !== 'pausing' && (
                    <div
                        className={localStyles.actionCancel}
                        onClick={() => {
                            !this.state.canceling && this.handleCancel()
                        }}
                    >
                        {!this.state.canceling ? (
                            'Cancel'
                        ) : (
                            <MovingDotsLabel
                                text="Finishing current batch"
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
                <PrimaryAction
                    onClick={() => {
                        this.props.onFinish()
                    }}
                    label={'Return to Settings'}
                />
            </div>
        )
    }

    renderFail() {
        return (
            <div className={localStyles.fail}>
                {this.props.renderFailMessage(this.state.info.state)}
                <div className={settingsStyle.buttonArea}>
                    <div />
                    <PrimaryAction
                        onClick={() => {
                            this.props.onFinish()
                        }}
                        label={'Return to Settings'}
                    />
                </div>
            </div>
        )
    }

    render() {
        const { info, status, overlay } = this.state
        if (!info) {
            return <LoadingBlocker />
        }

        return (
            <div>
                <div className={settingsStyle.section}>
                    {status === 'running' && this.renderRunning(info)}
                    {status === 'success' && this.renderSuccess()}
                    {status === 'fail' && this.renderFail()}
                    <FailedOverlay
                        disabled={!overlay}
                        onClick={async action => {
                            if (action === 'continue') {
                                await this.startRestore()
                            }
                            this.setState({
                                overlay: null,
                            })
                        }}
                    />
                </div>
            </div>
        )
    }
}
