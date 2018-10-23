import React from 'react'
import PropTypes from 'prop-types'
import styles from './presentation.css'

export default function BackupSettings(props) {
    if (props.status === 'unauthenticated') {
        return <PreLogin onLoginRequested={props.onLoginRequested} />
    } else if (props.status === 'authenticated') {
        return <PreBackup startBackup={props.startBackup} />
    } else if (props.status === 'running') {
        return <BackupRunning info={props.info} />
    } else if (props.status === 'success' || props.status === 'fail') {
        return <PostBackup status={props.status} />
    }
}

BackupSettings.propTypes = {
    info: PropTypes.object,
    status: PropTypes.string.isRequired,
    onLoginRequested: PropTypes.func.isRequired,
    startBackup: PropTypes.func.isRequired,
}

export function PreLogin(props) {
    return (
        <div>
            <SettingsHeader />
            <ProviderList onLoginRequested={props.onLoginRequested} />
        </div>
    )
}

PreLogin.propTypes = {
    onLoginRequested: PropTypes.func.isRequired,
}

export function PreBackup(props) {
    return (
        <div>
            <SettingsHeader />
            <ProviderList />
            <PrimaryButton onClick={props.startBackup} />
        </div>
    )
}

PreBackup.propTypes = {
    startBackup: PropTypes.func.isRequired,
}

export function BackupRunning(props) {
    return (
        <div>
            <SettingsHeader />
            <ProviderList />
            <BackupProgressBar
                value={props.info.processedChanges / props.info.totalChanges}
            />
            <div className={styles.progressHelpText}>
                You can leave this page and come back at any time.
            </div>
            {/* <PrimaryButton onClick={() => { }}>Pause</PrimaryButton> */}
        </div>
    )
}

BackupRunning.propTypes = {
    info: PropTypes.object,
}

export function PostBackup(props) {
    return <span>Post backup: {props}</span>
}

export function SettingsHeader(props) {
    return (
        <div>
            <h1>Backups</h1>
            Backup your data to your favorite cloud provider.
        </div>
    )
}
