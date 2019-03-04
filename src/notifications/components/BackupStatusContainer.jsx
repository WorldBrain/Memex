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
        backupStatus: null,
    }

    async componentDidMount() {
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        const backupStatus = await getLocalStorage('backupStatus', {
            state: 'no_backup',
            message:
                'You have not yet done any backup. Hit the backup button below and follow the wizard to backup.',
        })
        const backupTimes = await remoteFunction('getBackupTimes')()
        console.log('backupTimes', !(backupTimes.nextBackup === null))
        this.setState({
            automaticBackupEnabled: await remoteFunction(
                'isAutomaticBackupEnabled',
            )(),
            backupTimes: await remoteFunction('getBackupTimes')(),
            hasNextBackup: !(backupStatus.nextBackup === null),
            backupLocation: await remoteFunction('getBackendLocation')(),
            hasInitialBackup,
            backupStatus,
        })
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
            backupStatus,
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
                backupStatus={backupStatus}
            />
        )
    }
}

export default BackupStatusContainer
