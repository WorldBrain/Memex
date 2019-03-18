import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import { getLocalStorage } from 'src/util/storage'
import BackupStatus from './BackupStatus'

class BackupStatusContainer extends Component {
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
        automaticBackupEnabled: null,
        backupTimes: null,
        hasInitialBackup: false,
        hasNextBackup: false,
        backupLocation: null,
        hover: false,
        childPosition: '',
        backupState: null,
    }

    async componentDidMount() {
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        const backupStatus = await getLocalStorage('backup-status', {
            state: 'no_backup',
            id: 'no_backup',
        })
        const getBackupState = await this.backupState(hasInitialBackup)
        // const autBack = await remoteFunction('checkAutomaticBakupEnabled')()
        // console.log('automaticBackup', autBack)
        // console.log('hasSub', await localStorage.getItem('backup.has-subscription'))
        // console.log('nextBackup', await localStorage.getItem('nextBackup'))
        // console.log('backup-status', backupStatus)
        this.setState({
            automaticBackupEnabled: await remoteFunction(
                'isAutomaticBackupEnabled',
            )(),
            backupTimes: await remoteFunction('getBackupTimes')(),
            hasNextBackup: !(backupStatus.nextBackup === null),
            backupLocation: await remoteFunction('getBackendLocation')(),
            hasInitialBackup,
            backupState: getBackupState,
        })
    }

    backupState = async hasInitialBackup => {
        let backupState
        const backupStatus = await getLocalStorage('backup-status', {
            state: 'no_backup',
            id: 'no_backup',
        })
        if (backupStatus.state === 'success') {
            backupState = {
                state: 'success',
                message:
                    'Your last backup was successfull. Hit Backup Now if you want to backup again.',
            }
        } else if (backupStatus.state === 'fail') {
            let message
            if (backupState.id === 'backup_error') {
                message =
                    'Your last backup was unsuccessfull as there was no internet connectivity. Please try again'
            } else if (backupState.id === 'drive_size_empty') {
                message =
                    'Your last backup was unsuccessfull as there was no space in your google drive. Please clear some space and try again'
            } else if (backupState.id === 'auto_backup_expired') {
                message =
                    'Your Memex subscription has expired. Renew your subscription else Backups will have to be done manually.'
            } else if (
                backupState.id === 'auto_backup_expired' &&
                !hasInitialBackup
            ) {
                message =
                    'Great! You upgraded to automatic backups. However you will have to do your first backup manually.'
            }
            backupState = {
                state: 'fail',
                message,
            }
        } else if (backupStatus.state === 'no_backup') {
            backupState = {
                state: 'success',
                message:
                    'Your data is only stored on your computer. Back it up locally or to any cloud storage for free.',
            }
        }
        return backupState
    }

    onMouseEnterHandler = () => {
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
        const { checkedIcon, crossIcon, backupUrl } = this.props
        const {
            hasInitialBackup,
            backupTimes,
            backupLocation,
            isAutomaticBackupEnabled,
            hover,
            backupState,
        } = this.state
        return (
            <BackupStatus
                onMouseEnter={this.onMouseEnterHandler}
                onMouseLeave={this.onMouseLeaveHandler}
                hasInitBackup={hasInitialBackup}
                checkedIcon={checkedIcon}
                crossIcon={crossIcon}
                hover={hover}
                backupTimes={backupTimes}
                backupLocation={backupLocation}
                isAutomaticBackupEnabled={isAutomaticBackupEnabled}
                backupUrl={backupUrl}
                backupState={backupState}
            />
        )
    }
}

export default BackupStatusContainer
