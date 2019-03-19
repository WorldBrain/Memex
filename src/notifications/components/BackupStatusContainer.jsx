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
        backupLocation: null,
        hover: false,
        childPosition: '',
        backupState: {
            state: 'no_backup',
            id: 'no_backup',
        },
        billingPeriod: 'monthly',
        paymentUrl: '',
    }

    async componentDidMount() {
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        const automaticBackupEnabled = await remoteFunction(
            'isAutomaticBackupEnabled',
        )()
        const getBackupState = await this.backupState(
            hasInitialBackup,
            automaticBackupEnabled,
        )
        this.setState({
            automaticBackupEnabled,
            backupTimes: await remoteFunction('getBackupTimes')(),
            backupLocation: await remoteFunction('getBackendLocation')(),
            hasInitialBackup,
            backupState: getBackupState,
            paymentUrl: `http://worldbrain.io/?add-to-cart=7542&variation_id=7544`,
        })
    }

    backupState = async (hasInitialBackup, automaticBackupEnabled) => {
        let backupState
        const backupStatus = await getLocalStorage('backup-status', {
            state: 'no_backup',
            backupId: 'no_backup',
        })
        if (backupStatus.state === 'success') {
            backupState = {
                state: 'success',
                header: 'Backup Successful',
                message:
                    'Your last backup was successfull. Hit Backup Now if you want to backup again.',
            }
        } else if (backupStatus.state === 'fail') {
            let message
            if (backupStatus.backupId === 'backup_error') {
                message =
                    'Your last backup was unsuccessfull as there was no internet connectivity. Please try again'
            } else if (backupStatus.backupId === 'drive_size_empty') {
                message =
                    'Your last backup was unsuccessfull as there was no space in your google drive. Please clear some space and try again'
            } else if (backupStatus.backupId === 'auto_backup_expired') {
                message =
                    'Your Memex subscription has expired. Renew your subscription else Backups will have to be done manually.'
            } else if (
                backupStatus.backupId === 'auto_backup_expired' &&
                !hasInitialBackup
            ) {
                message =
                    'Great! You upgraded to automatic backups. However you will have to do your first backup manually.'
            }
            backupState = {
                state: 'fail',
                header: 'Backup Fail',
                message,
            }
        } else if (backupStatus.state === 'no_backup') {
            if (automaticBackupEnabled) {
                backupState = {
                    state: 'fail',
                    header: 'Do your first backup',
                    message:
                        'Great! You upgraded to automatic backups. You need to start your first backup manually.',
                }
            } else {
                backupState = {
                    state: 'fail',
                    header: 'No Backups yet',
                    message:
                        'Your data is only stored on your computer. Back it up locally or to any cloud storage for free.',
                }
            }
        }
        return backupState
    }

    onAutomaticBackupSelect = val => {
        this.setState(prevState => {
            if (val && !prevState.automaticBackupEnabled) {
                return {
                    backupState: {
                        state: 'autoBackup',
                        header: 'Automatic Backups are a premium feature',
                        message:
                            'Backup your data automatically every 15 minutes. Worry-free.',
                    },
                }
            } else {
                return null
            }
        })
    }

    onMouseEnterHandler = async () => {
        const backupState = await this.backupState()
        this.setState({
            hover: true,
            backupState,
        })
    }

    onMouseLeaveHandler = () => {
        this.setState({
            hover: false,
        })
    }

    onBillingPeriodChange = billingPeriod => {
        const productId = 7542
        const variationId = billingPeriod === 'yearly' ? 7545 : 7544
        this.setState({
            billingPeriod,
            paymentUrl: `http://worldbrain.io/?add-to-cart=${productId}&variation_id=${variationId}`,
        })
    }

    render() {
        const { checkedIcon, crossIcon, backupUrl } = this.props
        const {
            hasInitialBackup,
            backupTimes,
            backupLocation,
            automaticBackupEnabled,
            hover,
            backupState,
            billingPeriod,
            paymentUrl,
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
                automaticBackup={automaticBackupEnabled}
                backupUrl={backupUrl}
                backupState={backupState}
                onAutomaticBackupSelect={this.onAutomaticBackupSelect}
                onBillingPeriodChange={this.onBillingPeriodChange}
                billingPeriod={billingPeriod}
                paymentUrl={paymentUrl}
            />
        )
    }
}

export default BackupStatusContainer
