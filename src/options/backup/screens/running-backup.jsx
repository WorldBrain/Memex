import React from 'react'
import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import styles from './running-backup.css'
import { BackupProgressBar } from '../components/progress-bar'
import { PrimaryButton } from '../components/primary-button'

export default class RunningBackupContainer extends React.Component {
    static propTypes = {
        onFinish: PropTypes.func.isRequired,
    }

    state = { status: null, info: null }

    async componentDidMount() {
        browser.runtime.onMessage.addListener(this.messageListener)

        const info = await remoteFunction('getBackupInfo')()
        if (info) {
            this.setState({
                status: 'running',
                info,
            })
        } else {
            await remoteFunction('startBackup')()
        }

        // this.setState({
        //     status: 'running',
        //     info: { state: 'preparing' },
        // })
        // this.setState({
        //     status: 'running',
        //     info: { state: 'synching', totalChanges: 1000, processedChanges: 500 },
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
        browser.runtime.onMessage.removeListener(this.messageListener)
    }

    messageListener = message => {
        if (message.type === 'backup-event') {
            this.handleBackupEvent(message.event)
        }
    }

    handleBackupEvent(event) {
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
        remoteFunction('pauseBackup')()
    }

    handleResume() {
        remoteFunction('resumeBackup')()
    }

    handleCancel() {
        remoteFunction('cancelBackup')()
        this.props.onFinish()
    }

    render() {
        const { info, status } = this.state
        if (!info) {
            return null
        }

        const progressPercentage =
            info.state === 'synching'
                ? info.processedChanges / info.totalChanges
                : 0

        return (
            <div>
                <h2>Backup progress</h2>

                <div className={styles.steps}>
                    <div className={styles.step}>
                        <div className={styles.stepLabel}>
                            <span className={styles.stepNumber}>Step 1:</span>
                            Preparing uploads
                        </div>
                        <div className={styles.stepStatus}>
                            {info.state === 'preparing' && 'In progress'}
                            {info.state === 'synching' && 'Done'}
                        </div>
                    </div>
                    <div className={styles.step}>
                        <div className={styles.stepLabel}>
                            <span className={styles.stepNumber}>Step 2:</span>
                            Uploading your Memex backup
                        </div>
                        <div className={styles.stepStatus}>
                            {info.state === 'preparing' && 'Waiting'}
                            {status === 'running' &&
                                info.state === 'synching' &&
                                'In progress'}
                            {status === 'success' && 'Done'}
                        </div>
                    </div>
                </div>
                <BackupProgressBar value={progressPercentage} />
                <div className={styles.progressHelpText}>
                    You can leave this page and come back at any time.
                </div>
                {status === 'running' && (
                    <div className={styles.actions}>
                        <div
                            className={styles.actionCancel}
                            onClick={() => {
                                this.handleCancel()
                            }}
                        >
                            Cancel
                        </div>
                        {info.state !== 'paused' && (
                            <PrimaryButton
                                onClick={() => {
                                    this.handlePause()
                                }}
                            >
                                Pause
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
                    </div>
                )}
                {status === 'success' && (
                    <div className={styles.actions}>
                        <PrimaryButton
                            onClick={() => {
                                this.props.onFinish()
                            }}
                        >
                            Finish
                        </PrimaryButton>
                    </div>
                )}
            </div>
        )
    }
}
