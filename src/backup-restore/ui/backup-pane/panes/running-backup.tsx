import React from 'react'
import RunningProcess from './running-process'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import {
    WhiteSpacer20,
    WhiteSpacer30,
} from 'src/common-ui/components/design-library/typography'

const settingsStyle = require('src/options/settings/components/settings.css')
const STYLES = require('../../styles.css')

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
    return <div className={settingsStyle.sectionTitle}>Backup in Progress</div>
}

function renderFailMessage(errorId: string) {
    return errorId === 'network-error' ? (
        <React.Fragment>
            <div className={settingsStyle.sectionTitle}>
                ⚠️ Backup Failed! ⚠️
            </div>
            <div className={settingsStyle.infoText}>
                Please check your internet connectivity. If you still encounter
                issues please{' '}
                <a href="mailto:support@worldbrain.io">contact support</a>.
            </div>
        </React.Fragment>
    ) : (
        <div className={settingsStyle.infoText}>
            Please check whether you have enough space in your{' '}
            <a href="https://drive.google.com">Google Drive</a>. Backup failed
            as the size of the data to be uploaded was greater than the
            remaining upload space available in your Google Drive. Clear some
            space on the drive in order to successfully back up your data. If
            you still encounter issues please{' '}
            <a href="mailto:support@worldbrain.io">contact support</a>.
        </div>
    )
}

function renderSuccessMessage() {
    return (
        <React.Fragment>
            <div className={settingsStyle.sectionTitle}>
                Backup Successful! 🎉
            </div>
            <WhiteSpacer30 />
        </React.Fragment>
    )
}
