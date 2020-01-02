import moment from 'moment'
import React from 'react'
import classNames from 'classnames'
import { remoteFunction } from 'src/util/webextensionRPC'
import SmallButton from '../../../../common-ui/components/small-button'
import LoadingBlocker from '../../../../common-ui/components/loading-blocker'
import RestoreConfirmation from '../components/restore-confirmation'
import { browser } from 'webextension-polyfill-ts'
import SubscribeModal from 'src/authentication/components/Subscription/SubscribeModal'
import {
    UserProps,
    withCurrentUser,
} from 'src/authentication/components/AuthConnector'
import { UserFeature } from '@worldbrain/memex-common/lib/subscriptions/types'
import SyncDevicesPane from 'src/sync/components/SyncDevicesPane'
import { fetchBackupPath, checkServerStatus } from '../../utils'

const styles = require('../../styles.css')
const localStyles = require('./overview.css')

interface Props {
    onBackupRequested: (...args: any[]) => any
    onRestoreRequested: (...args: any[]) => any
    onBlobPreferenceChange: (...args: any[]) => any
    onPaymentRequested: (...args: any[]) => any
    authorizedFeatures: UserFeature[]
    backupPath: string
}

export class OverviewContainer extends React.Component<Props & UserProps> {
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

    openSubscriptionModal = () => this.setState({ subscribeModal: true })
    closeSubscriptionModal = () => this.setState({ subscribeModal: false })

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

                <p className={styles.header2}>
                    <strong>BACKUP STATUS</strong>
                </p>
                {!this.state.hasInitialBackup ? (
                    <div className={localStyles.statusLine}>
                        <p>You haven't set up any backups yet.</p>
                        <SmallButton
                            onClick={this.props.onBackupRequested}
                            color="darkblue"
                            extraClass={localStyles.right}
                        >
                            Start Wizard
                        </SmallButton>
                    </div>
                ) : (
                    <div>
                        {/* The status line with last backup time */}
                        <div className={localStyles.statusLine}>
                            <div>
                                <span className={localStyles.boldText}>
                                    Last backup:
                                </span>
                                <span className={localStyles.time}>
                                    {this.state.backupTimes.lastBackup
                                        ? moment(
                                              this.state.backupTimes.lastBackup,
                                          ).fromNow()
                                        : "You haven't made any backup yet"}
                                </span>
                            </div>
                            <SmallButton
                                color="green"
                                onClick={this.props.onBackupRequested}
                            >
                                {this.state.backupTimes.nextBackup !== 'running'
                                    ? 'Backup Now'
                                    : 'Go to Backup'}
                            </SmallButton>
                        </div>
                        {this.state.backupTimes.nextBackup && (
                            <div className={localStyles.statusLine}>
                                <span className={localStyles.nextBackupLine}>
                                    <span className={styles.name}>
                                        Next backup:
                                    </span>
                                    <span className={localStyles.time}>
                                        {this.state.backupTimes.nextBackup !==
                                        'running'
                                            ? automaticBackupsAllowed &&
                                              moment(
                                                  this.state.backupTimes
                                                      .nextBackup,
                                              ).fromNow()
                                            : 'in progress'}
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Section */}
                    <div>
                        <p className={styles.header2}>
                            <strong>SETTINGS</strong>
                        </p>
                        <div className={styles.option}>
                            {!automaticBackupsAllowed && !this.state.automaticBackupEnabled && (
                                <div>
                                    <span className={styles.name}>
                                        Enable Automatic Backups
                                    </span>
                                    <SmallButton
                                        extraClass={localStyles.right}
                                        onClick={this.openSubscriptionModal}
                                        color={'darkblue'}
                                    >
                                        {'⭐️ Upgrade'}
                                    </SmallButton>
                                    <span
                                        className={classNames(
                                            styles.subname,
                                            localStyles.limitWidth,
                                        )}
                                    >
                                        Worry-free. Automatically backs up your data
                                        every 15 minutes.
                                    </span>
                                </div>

                            )}

                            {automaticBackupsAllowed && !this.state.automaticBackupEnabled && (
                                <div>
                                <span className={styles.name}>
                                    Automatic Backups still disabled
                                </span>
                                <SmallButton
                                    extraClass={localStyles.right}
                                    onClick={this.props.onBackupRequested}
                                    color={'red'}
                                >
                                    {'Enable'}
                                </SmallButton>
                                 <span
                                    className={classNames(
                                        styles.subname,
                                        localStyles.limitWidth,
                                    )}
                                >
                                    You successfully upgraded but didn't enable automatic backups
                                </span>
                                </div>
                            )}

                            {this.state.automaticBackupEnabled && (
                                <div>
                                <span className={styles.name}>
                                    Automatic Backups: Enabled
                                </span>
                                <SmallButton
                                    extraClass={localStyles.right}
                                    onClick={this.openSubscriptionModal}
                                    color={'green'}
                                >
                                    {'✓ Enabled'}
                                </SmallButton>
                                <span
                                    className={classNames(
                                        styles.subname,
                                        localStyles.limitWidth,
                                    )}
                                >
                                    All set. Your data is backed up every 15 minutes.
                                </span>
                                </div>
                            )}
                        </div>
                    </div>
                {this.state.hasInitialBackup ? (
                    <div className={styles.option}>
                        <span className={styles.name}>Backup Location</span>
                        <SmallButton
                            extraClass={localStyles.right}
                            color={'green'}
                            onClick={() =>
                                this.props.onBackupRequested(true)
                            }
                        >
                            Change
                        </SmallButton>
                        {this.state.backupLocation === 'local' ? (
                            <span
                                className={classNames(
                                    styles.subname,
                                    localStyles.limitWidth,
                                )}
                            >
                                {this.state.backupPath}
                            </span>
                        ) : (
                            <span
                                className={classNames(
                                    styles.subname,
                                    localStyles.limitWidth,
                                )}
                            >
                                Google Drive
                            </span>
                        )}
                    </div>
                ) : null}
                <div className={styles.option}>
                    <span className={styles.name}>
                        Restore &amp; Replace
                    </span>
                    <SmallButton
                        onClick={() =>
                            this.setState({ showRestoreConfirmation: true })
                        }
                        color="green"
                        extraClass={localStyles.right}
                    >
                        Restore
                    </SmallButton>

                    <br />
                    <span
                        className={classNames(
                            styles.subname,
                            localStyles.limitWidth,
                        )}
                    >
                        <b>Replace</b> all current data with a backup.
                    </span>
                </div>
                <div>
                    <SyncDevicesPane />
                    {this.state.subscribeModal && (
                        <SubscribeModal onClose={this.closeSubscriptionModal} />
                    )}
                </div>
            </div>
        )
    }
}

export default withCurrentUser(OverviewContainer)
