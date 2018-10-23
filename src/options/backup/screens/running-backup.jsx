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
        }

        // this.setState({
        //     status: 'running',
        //     info: { status: 'preparing' },
        // })
        // this.setState({
        //     status: 'running',
        //     info: { status: 'synching', totalChanges: 1000, processedChanges: 500 },
        // })
        // this.setState({
        //     status: 'success',
        //     info: { status: 'synching', totalChanges: 1000, processedChanges: 10 },
        // })
        // this.setState({
        //     status: 'fail',
        //     info: { status: 'synching', totalChanges: 1000, processedChanges: 10 },
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
            this.setState({ status: 'running', info: event.info })
        } else if (event.type === 'success') {
            this.props.onFinish()
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
        const { info } = this.state
        const progressPercentage =
            this.state.info && this.state.info.status === 'synching'
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
                        <div className={styles.stepStatus}>In progress</div>
                    </div>
                    <div className={styles.step}>
                        <div className={styles.stepLabel}>
                            <span className={styles.stepNumber}>Step 1:</span>
                            Uploading your Memex backup
                        </div>
                        <div className={styles.stepStatus}>Waiting</div>
                    </div>
                </div>
                <BackupProgressBar value={progressPercentage} />
                <div className={styles.progressHelpText}>
                    You can leave this page and come back at any time.
                </div>
                <div
                    onClick={() => {
                        this.handleCancel()
                    }}
                >
                    Cancel
                </div>
                {this.state.info.state !== 'paused' && (
                    <PrimaryButton
                        onClick={() => {
                            this.handlePause()
                        }}
                    >
                        Pause
                    </PrimaryButton>
                )}
                {this.state.info.state === 'paused' && (
                    <PrimaryButton
                        onClick={() => {
                            this.handleResume()
                        }}
                    >
                        Resume
                    </PrimaryButton>
                )}
            </div>
        )
    }
}
