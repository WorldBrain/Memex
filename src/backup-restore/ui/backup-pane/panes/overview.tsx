import moment from 'moment'
import React, { Component } from 'react'
import classNames from 'classnames'
import { remoteFunction } from 'src/util/webextensionRPC'
import LoadingBlocker from '../../../../common-ui/components/loading-blocker'
import RestoreConfirmation from '../components/restore-confirmation'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { WhiteSpacer10 } from 'src/common-ui/components/design-library/typography'
import { UserFeature } from '@worldbrain/memex-common/lib/subscriptions/types'
import { fetchBackupPath, checkServerStatus } from '../../utils'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'

const styles = require('../../styles.css')
const settingsStyle = require('src/options/settings/components/settings.css')
const localStyles = require('./overview.css')

interface Props {
    onBackupRequested: (...args: any[]) => any
    onRestoreRequested: (...args: any[]) => any
    onBackupSetupRequested: (...args: any[]) => any
    onBlobPreferenceChange: (...args: any[]) => any
    onPaymentRequested: (...args: any[]) => any
    authorizedFeatures: UserFeature[]
    backupPath: string
    showSubscriptionModal: () => void
}

export class OverviewContainer extends Component<Props & UserProps> {
    state = {
        automaticBackupEnabled: null,
        backupTimes: null,
        hasInitialBackup: false,
        showAutomaticUpgradeDetails: false,
        showWarning: false,
        // upgradeBillingPeriod: null,
        showRestoreConfirmation: false,
        backupLocation: null,
        blobPreference: true,
        /* Pricing */
        showPricing: false,
        billingPeriod: null,
        subscribeModal: false,
        backupPath: null,
    }

    async componentDidMount() {
        const status = await checkServerStatus()
        const backupTimes = await remoteFunction('getBackupTimes')()
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        const backupLocation = await remoteFunction('getBackendLocation')()
        const automaticBackupEnabled = await remoteFunction(
            'isAutomaticBackupEnabled',
        )()
        let showWarning = false
        let backupPath = null
        if (!hasInitialBackup && automaticBackupEnabled) {
            showWarning = true
        }
        if (status) {
            backupPath = await fetchBackupPath()
        }
        this.setState({
            automaticBackupEnabled,
            backupTimes,
            hasInitialBackup,
            backupLocation,
            showWarning,
            backupPath,
        })
    }

    handleToggle = () => {
        const blobPreference = !this.state.blobPreference
        this.props.onBlobPreferenceChange(blobPreference)
        this.setState({
            blobPreference,
        })
    }

    openSubscriptionModal = () => this.props.showSubscriptionModal()

    enableAutomaticBackup() {
        if (this.state.hasInitialBackup === true) {
            localStorage.setItem('backup.automatic-backups-enabled', 'true')
            this.setState({ automaticBackupEnabled: true })
        } else {
            this.props.onBackupSetupRequested()
        }
    }

    disableAutomaticBackup() {
        localStorage.setItem('backup.automatic-backups-enabled', 'false')
        this.setState({ automaticBackupEnabled: false })
    }

    render() {
        const automaticBackupsAllowed = this.props.authorizedFeatures.includes(
            'backup',
        )

        if (!this.state.backupTimes) {
            return <LoadingBlocker />
        }

        return (
            <div>
                {this.state.showWarning && (
                    <div className={styles.showWarning}>
                        <span className={styles.WarningIcon} />
                        <span className={styles.showWarningText}>
                            The first backup must be done manually. Follow{' '}
                            <span
                                className={styles.underline}
                                onClick={this.props.onBackupRequested}
                            >
                                the wizard
                            </span>{' '}
                            to get started.
                        </span>
                    </div>
                )}
                {this.state.showRestoreConfirmation && (
                    <RestoreConfirmation
                        onConfirm={this.props.onRestoreRequested}
                        onClose={() =>
                            this.setState({ showRestoreConfirmation: false })
                        }
                    />
                )}
                <div className={settingsStyle.section}>
                    <div className={settingsStyle.sectionTitle}>
                        Backup Status
                    </div>
                    {!this.state.hasInitialBackup ? (
                        <div className={localStyles.statusLine}>
                            <div>
                                <p
                                    className={classNames(
                                        settingsStyle.subname,
                                        localStyles.limitWidth,
                                    )}
                                >
                                    Backup your data to your local hard drive or
                                    your favorite cloud provider.
                                </p>
                                <p>You haven't set up any backups yet.</p>
                            </div>
                            <PrimaryAction
                                onClick={this.props.onBackupRequested}
                                label={'Start Wizard'}
                            />
                        </div>
                    ) : (
                        <div>
                            {/* The status line with last backup time */}
                            <WhiteSpacer10 />
                            <div className={localStyles.statusLine}>
                                <div>
                                    <span className={localStyles.boldText}>
                                        Last backup:
                                    </span>
                                    <span className={localStyles.time}>
                                        {this.state.backupTimes.lastBackup
                                            ? moment(
                                                  this.state.backupTimes
                                                      .lastBackup,
                                              ).fromNow()
                                            : "You haven't made any backup yet"}
                                    </span>
                                    {this.state.backupTimes.nextBackup && (
                                        <div className={localStyles.statusLine}>
                                            <span
                                                className={
                                                    localStyles.nextBackupLine
                                                }
                                            >
                                                <span className={styles.name}>
                                                    Next backup:
                                                </span>
                                                <span
                                                    className={localStyles.time}
                                                >
                                                    {this.state.backupTimes
                                                        .nextBackup !==
                                                    'running'
                                                        ? automaticBackupsAllowed &&
                                                          moment(
                                                              this.state
                                                                  .backupTimes
                                                                  .nextBackup,
                                                          ).fromNow()
                                                        : 'in progress'}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <PrimaryAction
                                    onClick={this.props.onBackupRequested}
                                    label={
                                        this.state.backupTimes.nextBackup !==
                                        'running'
                                            ? 'Backup Now'
                                            : 'Go to Backup'
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Section */}
                <div className={settingsStyle.section}>
                    <div className={settingsStyle.sectionTitle}>Settings</div>
                    <div className={styles.option}>
                        {!automaticBackupsAllowed && (
                            <div className={localStyles.statusLine}>
                                <div>
                                    <span className={styles.name}>
                                        Enable Automatic Backups
                                    </span>
                                    <span
                                        className={classNames(
                                            settingsStyle.subname,
                                            localStyles.limitWidth,
                                        )}
                                    >
                                        Worry-free. Automatically backs up your
                                        data every 15 minutes.
                                    </span>
                                </div>
                                <SecondaryAction
                                    onClick={this.openSubscriptionModal}
                                    label={'⭐️ Upgrade'}
                                />
                            </div>
                        )}

                        {automaticBackupsAllowed &&
                            !this.state.automaticBackupEnabled && (
                                <div className={localStyles.statusLine}>
                                    <div>
                                        <span className={styles.name}>
                                            Automatic Backups still disabled
                                        </span>
                                        <span
                                            className={classNames(
                                                settingsStyle.subname,
                                                localStyles.limitWidth,
                                            )}
                                        >
                                            {
                                                "You successfully upgraded but haven't enable automatic backups"
                                            }
                                        </span>
                                    </div>
                                    <PrimaryAction
                                        onClick={() =>
                                            this.enableAutomaticBackup()
                                        }
                                        label={'Enable'}
                                    />
                                </div>
                            )}

                        {automaticBackupsAllowed &&
                            this.state.automaticBackupEnabled && (
                                <div className={localStyles.statusLine}>
                                    <div>
                                        <span className={styles.name}>
                                            Automatic Backups: Enabled
                                        </span>
                                        <span
                                            className={classNames(
                                                settingsStyle.subname,
                                                localStyles.limitWidth,
                                            )}
                                        >
                                            All set. Your data is backed up
                                            every 15 minutes.
                                        </span>
                                    </div>
                                    <SecondaryAction
                                        onClick={() =>
                                            this.disableAutomaticBackup()
                                        }
                                        label={'✓ Enabled'}
                                    />
                                </div>
                            )}
                    </div>
                    {this.state.hasInitialBackup ? (
                        <div className={styles.option}>
                            <div className={localStyles.statusLine}>
                                <div>
                                    <span className={styles.name}>
                                        Backup Location
                                    </span>
                                    {this.state.backupLocation === 'local' ? (
                                        <span
                                            className={classNames(
                                                settingsStyle.subname,
                                                localStyles.limitWidth,
                                            )}
                                        >
                                            {this.state.backupPath === null &&
                                            this.state.backupLocation ===
                                                'local'
                                                ? '⚠️Your Memex Backup Helper is not running!'
                                                : this.state.backupPath}
                                        </span>
                                    ) : (
                                        <span
                                            className={classNames(
                                                settingsStyle.subname,
                                                localStyles.limitWidth,
                                            )}
                                        >
                                            Google Drive
                                        </span>
                                    )}
                                </div>
                                <SecondaryAction
                                    label={'Change'}
                                    onClick={() =>
                                        this.props.onBackupRequested(true)
                                    }
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className={settingsStyle.section}>
                    <div className={settingsStyle.sectionTitle}>
                        Restore & Replace
                    </div>
                    <div className={styles.option}>
                        <div className={localStyles.statusLine}>
                            <span
                                className={classNames(
                                    settingsStyle.subname,
                                    localStyles.limitWidth,
                                )}
                            >
                                <b>Replace</b> all current data with a backup.
                            </span>
                            <SecondaryAction
                                onClick={() =>
                                    this.setState({
                                        showRestoreConfirmation: true,
                                    })
                                }
                                label={'Restore'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default connect(null, dispatch => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(OverviewContainer))
