import moment from 'moment'
import React, { Component } from 'react'
import classNames from 'classnames'
import { remoteFunction, runInBackground } from 'src/util/webextensionRPC'
import LoadingBlocker from '../../../../common-ui/components/loading-blocker'
import RestoreConfirmation from '../components/restore-confirmation'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { WhiteSpacer10 } from 'src/common-ui/components/design-library/typography'
import { UserFeature } from '@worldbrain/memex-common/lib/subscriptions/types'
import { fetchBackupPath, checkServerStatus } from '../../utils'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { AuthContextInterface } from 'src/authentication/background/types'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'
import { auth, subscription } from 'src/util/remote-functions-background'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'
import { DumpPane } from './dump-pane'

const styles = require('../../styles.css')
const settingsStyle = require('src/options/settings/components/settings.css')
const localStyles = require('./overview.css')

interface Props {
    onBackupRequested: (...args: any[]) => any
    onRestoreRequested: (...args: any[]) => any
    onBackupSetupRequested: (...args: any[]) => any
    onBlobPreferenceChange: (...args: any[]) => any
    onPaymentRequested: (...args: any[]) => any
    onDumpRequested: (...args: any[]) => any
    authorizedFeatures: UserFeature[]
    backupPath: string
    showSubscriptionModal: () => void
    personalCloudBG?: PersonalCloudRemoteInterface
}

export class OverviewContainer extends Component<Props & AuthContextInterface> {
    static defaultProps: Pick<Props, 'personalCloudBG'> = {
        personalCloudBG: runInBackground(),
    }

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
        loadingChargebee: false,
        isCloudSyncEnabled: true,
        isDev: process.env.NODE_ENV !== 'production',
    }

    async componentDidMount() {
        const status = await checkServerStatus()
        const isCloudSyncEnabled = await this.props.personalCloudBG.isCloudSyncEnabled()
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
            isCloudSyncEnabled,
            backupTimes,
            hasInitialBackup,
            backupLocation,
            showWarning,
            backupPath,
        })
    }

    openPortal = async () => {
        this.setState({
            loadingChargebee: true,
        })
        const portalLink = await subscription.getManageLink()
        window.open(portalLink['access_url'])
        this.setState({
            loadingChargebee: false,
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

    private renderUpgradeBtn() {
        if (this.state.loadingChargebee) {
            return (
                <SecondaryAction
                    label={<LoadingIndicator />}
                    onClick={undefined}
                />
            )
        }

        return (
            <SecondaryAction
                label="⭐️ Upgrade"
                onClick={
                    this.props.currentUser?.subscriptionStatus
                        ? this.openPortal
                        : this.props.showSubscriptionModal
                }
            />
        )
    }

    private renderOldBackupPanes() {
        const automaticBackupsAllowed = this.props.currentUser?.authorizedFeatures?.includes(
            'backup',
        )
        return (
            <>
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
                {this.state.hasInitialBackup && (
                    <div className={settingsStyle.section}>
                        <div className={styles.option}>
                            <div className={settingsStyle.sectionTitle}>
                                Backup Location
                            </div>
                            <div className={localStyles.statusLine}>
                                <div>
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
                    </div>
                )}
                <div className={settingsStyle.section}>
                    <div className={settingsStyle.sectionTitle}>
                        Restore & Replace
                    </div>
                    <div className={styles.option}>
                        <div className={localStyles.statusLine}></div>
                    </div>
                </div>
            </>
        )
    }

    render() {
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
                {!this.state.isCloudSyncEnabled ? (
                    this.renderOldBackupPanes()
                ) : (
                    <DumpPane onDumpClick={this.props.onDumpRequested} />
                )}
                {this.state.isDev && (
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
                                    <b>Replace</b> all current data with a
                                    backup.
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
                )}
            </div>
        )
    }
}

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(OverviewContainer))
