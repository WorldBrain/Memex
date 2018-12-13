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

function renderFailMessage() {
    return (
        <React.Fragment>
            <p className={STYLES.header2}>
                <strong>BACKUP FAILED </strong>
            </p>
            <p className={STYLES.name}>
                Please check whether you have enough space in your{' '}
                <a href="https://http://drive.google.com">Google Drive</a> and
                the stability of your internet connection. You can retry the
                backup anytime you want. <br /> If you still encounter issues
                please{' '}
                <a href="mailto:support@worldbrain.io">contact support</a>.
            </p>
        </React.Fragment>
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
