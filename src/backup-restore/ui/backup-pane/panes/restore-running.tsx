import React from 'react'
import RunningProcess from './running-process'
const styles = require('../../styles.css')

export default function RestoreRunning({ onFinish }: { onFinish: () => void }) {
    return (
        <RunningProcess
            functionNames={{
                info: 'getRestoreInfo',
                start: 'startRestore',
                cancel: 'cancelRestore',
                pause: 'pauseRestore',
                resume: 'resumeRestore',
                sendNotif: 'sendNotification',
            }}
            eventMessageName="restore-event"
            preparingStepLabel="Preparing restore"
            synchingStepLabel="Restoring your Memex backup"
            renderHeader={renderHeader}
            renderFailMessage={renderFailMessage}
            renderSuccessMessage={renderSuccessMessage}
            onFinish={onFinish}
        />
    )
}

function renderHeader() {
    return <p className={styles.header2}>RESTORE IN PROGRESS</p>
}

function renderFailMessage() {
    return (
        <React.Fragment>
            <p className={styles.header2}>
                <strong>RESTORE FAILED </strong>
            </p>
            <p className={styles.subname}>
                You can retry the restore anytime you want. <br />
                If you still encounter issues please{' '}
                <a href="mailto:support@worldbrain.io">contact support</a>.
            </p>
        </React.Fragment>
    )
}

function renderSuccessMessage() {
    return (
        <p className={styles.header2}>
            <strong>RESTORE SUCCESSFUL: </strong>
            <p className={styles.subname}>
                Return to <a href="#/overview">the dashboard</a> to search,
                organise and annotate.
            </p>
        </p>
    )
}
