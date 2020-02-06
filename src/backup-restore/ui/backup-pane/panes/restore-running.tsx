import React from 'react'
import RunningProcess from './running-process'
import { WhiteSpacer20 } from 'src/common-ui/components/design-library/typography'
const settingsStyle = require('src/options/settings/components/settings.css')

const styles = require('../../styles.css')

export default function RestoreRunning({ onFinish }: { onFinish: () => void }) {
    return (
        <div>
            <div className={styles.background}>
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
            </div>
        </div>
    )
}

function renderHeader() {
    return (
        <p className={settingsStyle.sectionTitle}>
            Restore in Progress: Don't leave this page
        </p>
    )
}

function renderFailMessage() {
    return (
        <React.Fragment>
            <div className={styles.messageBox}>
                <div className={settingsStyle.sectionTitle}>
                    <strong>⚠️ Restore Failed! ⚠️ </strong>
                </div>
                <div className={settingsStyle.infoText}>
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
            <div className={styles.messageBox}>
                <div className={settingsStyle.sectionTitle}>
                    <strong>Restore Successful! 🎉 </strong>
                </div>
                <div className={settingsStyle.infoText}>
                    Return to <a href="#/overview">the dashboard</a> to search,
                    organise and annotate.
                </div>
            </div>
        </React.Fragment>
    )
}
