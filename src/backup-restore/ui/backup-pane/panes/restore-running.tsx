import React from 'react'
import RunningProcess from './running-process'
import type { BrowserSettingsStore } from 'src/util/settings'
import type { LocalBackupSettings } from 'src/backup-restore/background/types'

export default function RestoreRunning({
    onFinish,
    localBackupSettings,
}: {
    onFinish: () => void
    localBackupSettings: BrowserSettingsStore<LocalBackupSettings>
}) {
    return (
        <div>
            <div>
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
                    localBackupSettings={localBackupSettings}
                    onFinish={onFinish}
                />
            </div>
        </div>
    )
}

function renderHeader() {
    return <p>Restore in Progress: Don't leave this page</p>
}

function renderFailMessage() {
    return (
        <React.Fragment>
            <div>
                <div>
                    <strong>⚠️ Restore Failed! ⚠️ </strong>
                </div>
                <div>
                    You can retry the restore anytime.
                    <br />
                    If you still encounter issues please{' '}
                    <a href="mailto:support@worldbrain.io">contact support</a>.
                </div>
            </div>
        </React.Fragment>
    )
}

function renderSuccessMessage() {
    return (
        <React.Fragment>
            <div>
                <div>
                    <strong>Restore Successful! 🎉 </strong>
                </div>
                <div>
                    Return to <a href="#/overview">the dashboard</a> to search,
                    organise and annotate.
                </div>
            </div>
        </React.Fragment>
    )
}
