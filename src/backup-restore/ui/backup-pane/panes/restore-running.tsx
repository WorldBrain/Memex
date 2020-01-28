import React from 'react'
import RunningProcess from './running-process'
import {
    WhiteSpacer20,
} from 'src/common-ui/components/design-library/typography'
const settingsStyle = require('src/options/settings/components/settings.css')

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
    return <p className={settingsStyle.sectionHeader}>RESTORING: DON'T CLOSE THIS TAB</p>
}

function renderFailMessage() {
    return (
        <React.Fragment>
            <div className={settingsStyle.sectionTitle}>
                <strong>⚠️ Restore Failed! ⚠️ </strong>
            </div>
            <p className={settingsStyle.infoText}>
                You can retry the restore anytime you want. <br />
                If you still encounter issues please{' '}
                <a href="mailto:support@worldbrain.io">contact support</a>.
            </p>
        </React.Fragment>
    )
}

function renderSuccessMessage() {
    return (
        <React.Fragment>
            <div className={settingsStyle.sectionTitle}>
                <strong>Restore Successful! 🎉 </strong>
            </div>
                <WhiteSpacer20/>
            <p className={settingsStyle.infoText}>
                Return to <a href="#/overview">the dashboard</a> to search,
                organise and annotate.
            </p>
        </React.Fragment>
    )
}
