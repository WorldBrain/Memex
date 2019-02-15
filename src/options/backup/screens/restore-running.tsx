import React from 'react'
import RunningProcess from '../components/running-process'
const STYLES = require('../styles.css')

export default function RestoreRunning({ onFinish }: { onFinish: () => void }) {
    return (
        <RunningProcess
            functionNames={{
                info: 'getRestoreInfo',
                start: 'startRestore',
                cancel: 'cancelRestore',
                pause: 'pauseRestore',
                resume: 'resumeRestore',
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
    return <p className={STYLES.header2}>RESTORE PROGRESS</p>
}

function renderFailMessage() {
    return (
        <React.Fragment>
            <p className={STYLES.header2}>
                <strong>RESTORE FAILED </strong>
            </p>
            <p className={STYLES.name}>
                You can retry the restore anytime you want. <br />
                If you still encounter issues please{' '}
                <a href="mailto:support@worldbrain.io">contact support</a>.
            </p>
        </React.Fragment>
    )
}

function renderSuccessMessage() {
    return (
        <p className={STYLES.header2}>
            <strong>FINISHED: </strong>
            RESTORE WAS SUCCESSFUL
        </p>
    )
}
