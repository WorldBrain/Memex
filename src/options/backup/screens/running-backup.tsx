import React from 'react'
import RunningProcess from '../components/running-process'
const STYLES = require('../styles.css')

export default function RunningBackup({ onFinish }: { onFinish: () => void }) {
    return (
        <RunningProcess
            functionNames={{
                info: 'getBackupInfo',
                start: 'startBackup',
                cancel: 'cancelBackup',
                pause: 'pauseBackup',
                resume: 'resumeBackup',
                sendNotif: 'sendNotification',
            }}
            eventMessageName="backup-event"
            preparingStepLabel="Preparing uploads"
            synchingStepLabel="Uploading your Memex backup"
            renderHeader={renderHeader}
            renderFailMessage={renderFailMessage}
            renderSuccessMessage={renderSuccessMessage}
            onFinish={onFinish}
        />
    )
}

function renderHeader() {
    return (
        <p className={STYLES.header2}>
            <strong>STEP 4/5: </strong>
            BACKUP PROGRESS
        </p>
    )
}

function renderFailMessage(errorId: string) {
    return errorId === 'network-error' ? (
        <React.Fragment>
            <p className={STYLES.header2}>
                <strong>BACKUP FAILED </strong>
            </p>
            <p className={STYLES.name}>
                Please check your internet connectivity. Backup was not
                successful as the connection was either not strong enough or
                there was no connection. If you still encounter issues please{' '}
                <a href="mailto:support@worldbrain.io">contact support</a>.
            </p>
        </React.Fragment>
    ) : (
        <p className={STYLES.name}>
            Please check whether you have enough space in your{' '}
            <a href="https://drive.google.com">Google Drive</a> . Backup failed
            as the size of the data to be uploaded was greater than the
            remaining upload space available in your Google Drive. Clear some
            space on the drive in order to successfully back up your data. If
            you still encounter issues please{' '}
            <a href="mailto:support@worldbrain.io">contact support</a>.
        </p>
    )
}

function renderSuccessMessage() {
    return (
        <p className={STYLES.header2}>
            <strong>FINISHED: </strong>
            YOUR BACKUP WAS SUCCESSFUL
        </p>
    )
}
