import React from 'react'
import styled from 'styled-components'
import { remoteFunction } from 'src/util/webextensionRPC'
const localStyles = require('./running-process.css')
import ProgressBar from 'src/common-ui/components/ProgressBar'
import { FailedOverlay } from '../components/overlays'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { WhiteSpacer20 } from 'src/common-ui/components/design-library/typography'
import type { BrowserSettingsStore } from 'src/util/settings'
import type { LocalBackupSettings } from 'src/backup-restore/background/types'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'

const settingsStyle = require('src/options/settings/components/settings.css')

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
    localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
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
        globalThis['browser'].runtime.onMessage.addListener(
            this.messageListener,
        )

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
        globalThis['browser'].runtime.onMessage.removeListener(
            this.messageListener,
        )
    }

    startRestore = async () => {
        this.setState({
            status: 'running',
            info: { state: 'preparing' },
        })
        await remoteFunction(this.props.functionNames.start)()
    }

    messageListener = (message) => {
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
            await this.props.localBackupSettings.set('backupStatus', 'success')
            await this.props.localBackupSettings.set(
                'backupStatusId',
                'success',
            )
            this.setState({ status: 'success' })
            localStorage.setItem('progress-successful', 'true')
        } else if (event.type === 'fail') {
            const errorId = await remoteFunction(
                this.props.functionNames.sendNotif,
            )('error')
            await this.props.localBackupSettings.set('backupStatus', 'fail')
            await this.props.localBackupSettings.set(
                'backupStatusId',
                errorId === 'backup_error' ? errorId : 'drive_size_empty',
            )

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
        await localStorage.removeItem('backup.restore.restore-running')
        // await remoteFunction(this.props.functionNames.cancel)()
        this.props.onFinish()
    }

    renderRunning(info) {
        const progressPercentage =
            info.processedChanges && info.totalChanges
                ? (info.processedChanges / info.totalChanges) * 100
                : 0

        return (
            <div>
                <div className={localStyles.steps}>
                    {/* {this.renderSteps(info)} */}
                    <ProgressBar progress={progressPercentage} />
                </div>
                <WhiteSpacer20 />
                <WhiteSpacer20 />
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
                    <PrimaryAction
                        label={!this.state.canceling ? 'Cancel' : 'Sure?'}
                        onClick={() => {
                            this.state.canceling
                                ? this.handleCancel()
                                : this.setState({ canceling: true })
                        }}
                        type={'primary'}
                        size={'medium'}
                    />
                )}
            </div>
        )
    }

    renderSuccess() {
        return (
            <FinishContainer>
                <PrimaryAction
                    onClick={() => {
                        this.props.onFinish()
                    }}
                    label={'Return to Settings'}
                    type={'primary'}
                    size={'medium'}
                />
            </FinishContainer>
        )
    }

    renderFail() {
        return (
            <div className={localStyles.fail}>
                <div className={settingsStyle.buttonArea}>
                    <div />
                    <PrimaryAction
                        onClick={() => {
                            this.props.onFinish()
                        }}
                        label={'Return to Settings'}
                        type={'primary'}
                        size={'medium'}
                    />
                </div>
            </div>
        )
    }

    getTitle() {
        const { info, status, overlay } = this.state

        if (status === 'running') {
            return 'Backup in Progress'
        }

        if (status === 'success') {
            return 'Backup Successful'
        }
        if (status === 'fail') {
            return 'Backup Failed'
        }
    }

    getIcon() {
        const { info, status, overlay } = this.state

        if (status === 'running') {
            return 'reload'
        }

        if (status === 'success') {
            return 'check'
        }
        if (status === 'fail') {
            return 'warning'
        }
    }

    getDescription() {
        const { info, status, overlay } = this.state

        if (status === 'running') {
            return (
                (info.processedChanges && info.totalChanges
                    ? Math.floor(
                          (info.processedChanges / info.totalChanges) * 100,
                      )
                    : 0) + '%'
            )
        }

        if (status === 'fail') {
            return (
                <span>
                    There has been an issue with your backup process. <br />
                    Try again, and if the problem persists, please{' '}
                    <a href="mailto:support@memex.garden">contact support</a>.
                </span>
            )
        }
    }

    render() {
        const { info, status, overlay } = this.state
        if (!info) {
            return (
                <LoadingBox>
                    <LoadingIndicator size={30} />
                </LoadingBox>
            )
        }

        return (
            <SettingSection
                title={this.getTitle()}
                icon={this.getIcon()}
                description={this.getDescription()}
            >
                {status === 'running' && this.renderRunning(info)}
                {status === 'success' && this.renderSuccess()}
                {status === 'fail' && this.renderFail()}
                <FailedOverlay
                    disabled={!overlay}
                    onClick={async (action) => {
                        if (action === 'continue') {
                            await this.startRestore()
                        }
                        this.setState({
                            overlay: null,
                        })
                    }}
                />
            </SettingSection>
        )
    }
}

const LoadingBox = styled.div`
    height: 100%;
    width: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const FinishContainer = styled.div`
    display: grid;
    grid-gap: 30px;
    grid-auto-flow: row;
    justify-content: flex-start;
`
