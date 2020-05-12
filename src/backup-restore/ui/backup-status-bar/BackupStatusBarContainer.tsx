import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import { getLocalStorageTyped, LocalStorageTypes } from 'src/util/storage'
import StatusBar from './components/StatusBar'
import { BACKUP_STATUS_MESSAGES as messages } from '../../../notifications/constants'
import {
    BackupLocation,
    BackupStatusType,
    BackupTimes,
} from 'src/backup-restore/types'

interface Props {
    checkedIcon: string
    backupUrl: string
}

interface State {
    isAutomaticBackupEnabled: boolean
    isAutomaticBackupAllowed: boolean
    backupTimes?: BackupTimes
    hasInitialBackup: boolean
    backupLocation: BackupLocation
    hover: boolean
    showAutomaticBackupSubscription: boolean
    backupStatus: BackupStatusType
}

class BackupStatusBar extends Component<Props, State> {
    static propTypes = {
        checkedIcon: PropTypes.string,
        crossIcon: PropTypes.string,
        backupUrl: PropTypes.string,
    }

    static defaultProps = {
        checkedIcon: '/img/checkmarkGreen.svg',
        crossIcon: 'img/crossBlue.svg',
        backupUrl: '/options.html#/backup',
    }

    state = {
        backupTimes: {
            nextBackup: null,
            lastBackup: null,
        } as BackupTimes,
        backupLocation: null,
        backupStatus: {
            state: 'no_backup',
            backupId: 'no_backup',
        } as LocalStorageTypes['backup-status'],
        hasInitialBackup: false,
        isAutomaticBackupEnabled: false,
        isAutomaticBackupAllowed: false,
        hover: false,
        showAutomaticBackupSubscription: false,
    }

    async componentDidMount() {
        this.setState({
            isAutomaticBackupAllowed: await remoteFunction(
                'isAutomaticBackupAllowed',
            )(),
            isAutomaticBackupEnabled: await remoteFunction(
                'isAutomaticBackupEnabled',
            )(),
            backupTimes: await remoteFunction('getBackupTimes')(),
            backupLocation: await remoteFunction('getBackendLocation')(),
            hasInitialBackup: await remoteFunction('hasInitialBackup')(),
            backupStatus: await getLocalStorageTyped('backup-status', {
                state: 'no_backup',
                backupId: 'no_backup',
            }),
        })
    }

    onAutomaticBackupSelect = async (val: boolean) => {
        if (val && !this.state.isAutomaticBackupAllowed) {
            this.setState({
                showAutomaticBackupSubscription: val,
            })
        } else {
            this.setState({ showAutomaticBackupSubscription: false })
        }
    }

    onMouseEnterHandler = async () => {
        this.setState({
            hover: true,
        })
    }

    onMouseLeaveHandler = () => {
        this.setState({
            hover: false,
        })
    }

    render() {
        const {
            backupTimes,
            backupLocation,
            isAutomaticBackupEnabled,
            isAutomaticBackupAllowed,
            hover,
        } = this.state

        const backupUIState = calcBackupUIState(this.state)

        return (
            <StatusBar
                onMouseEnter={this.onMouseEnterHandler}
                onMouseLeave={this.onMouseLeaveHandler}
                hover={hover}
                backupTimes={backupTimes}
                isAutomaticBackupEnabled={isAutomaticBackupEnabled}
                isAutomaticBackupAllowed={isAutomaticBackupAllowed}
                backupUIState={backupUIState}
                onAutomaticBackupSelect={this.onAutomaticBackupSelect}
                paymentUrl={'/options.html#/backup'}
            />
        )
    }
}

interface BackupUIStateDependencies
    extends Pick<
        State,
        | 'showAutomaticBackupSubscription'
        | 'isAutomaticBackupEnabled'
        | 'isAutomaticBackupAllowed'
        | 'backupStatus'
    > {}

export interface BackupUIState {
    state: 'success' | 'fail' | 'autoBackup' | 'no_backup'
    header?: string
    message?: string
}
export const calcBackupUIState = (
    options: BackupUIStateDependencies,
): BackupUIState => {
    if (options.showAutomaticBackupSubscription) {
        return {
            state: 'autoBackup',
            header: '⭐️ This is a premium feature',
            message: messages.automatic_backup_message,
        }
    }

    const backupStatus = options.backupStatus

    if (backupStatus.state === 'success') {
        if (
            options.isAutomaticBackupEnabled &&
            options.isAutomaticBackupAllowed
        ) {
            return {
                state: 'success',
                header: 'Backup Status',
                message: 'All Good!',
            }
        } else {
            return {
                state: 'fail',
                header: 'Backup Status: manual',
                message: messages.automatic_backup_disabled_first_backup_done,
            }
        }
    } else if (backupStatus.state === 'fail') {
        let message
        if (
            backupStatus.backupId === 'backup_error' &&
            options.isAutomaticBackupEnabled
        ) {
            message = messages.unsuccessful_backup_auto_enabled
        } else if (backupStatus.backupId === 'backup_error') {
            message = messages.unsuccessful_backup_internet
        } else if (backupStatus.backupId === 'drive_size_empty') {
            message = messages.unsuccessful_backup_drive_size
        } else if (backupStatus.backupId === 'auto_backup_expired') {
            message = messages.subscription_expiration
        } else {
            message = messages.unknown_error
        }
        return {
            state: 'fail',
            header: 'Backup Fail',
            message,
        }
    } else if (backupStatus.state === 'no_backup') {
        if (
            options.isAutomaticBackupEnabled &&
            options.isAutomaticBackupAllowed
        ) {
            return {
                state: 'fail',
                header: 'Do your first backup',
                message: messages.upgraded_but_no_first_backup,
            }
        } else {
            return {
                state: 'fail',
                header: 'No Backups yet',
                message: messages.backup_only_local,
            }
        }
    }

    return {
        state: 'fail',
        header: 'error',
        message: 'Could not work out the state of the backups.',
    }
}

export default BackupStatusBar
