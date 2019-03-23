import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import { getLocalStorage } from 'src/util/storage'
import BackupStatus from './BackupStatus'
import { BACKUP_STATUS_MESSAGES as messages } from '../constants'

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
            if (automaticBackupEnabled) {
                backupState = {
                    state: 'success',
                    header: 'Backup Successful',
                    message: messages.successful_backup,
                }
            } else {
                backupState = {
                    state: 'fail',
                    header: 'Backup mode: manual',
                    message: messages.automatic_backup_disabled_first_backup_done,
                }
            }
        } else if (backupStatus.state === 'fail') {
            let message
            if (backupStatus.backupId === 'backup_error') {
                message = messages.unsuccessful_backup_internet
            } else if (backupStatus.backupId === 'drive_size_empty') {
                message = messages.unsuccessful_backup_drive_size
            } else if (backupStatus.backupId === 'auto_backup_expired') {
                message = messages.subscription_expiration
            } else {
                message = messages.unknown_error
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
                    message: messages.upgraded_but_no_first_backup,
                }
            } else {
                backupState = {
                    state: 'fail',
                    header: 'No Backups yet',
                    message: messages.backup_only_local,
                }
            }
        } else if (backupState.state !== 'fail' && automaticBackupEnabled) {
             backupState = {
                    state: 'success',
                    header: 'Backup Successful',
                    message: null,
            }
        }
        return backupState
    }

    onAutomaticBackupSelect = async val => {
        this.setState(prevState => {
            if (val && !prevState.automaticBackupEnabled) {
                return {
                    backupState: {
                        state: 'autoBackup',
                        header: 'This is a premium feature',
                        message: messages.automatic_backup_message,
                    },
                }
            } else {
                return null
            }
        })
        await remoteFunction('setupRequestInterceptor')()
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
