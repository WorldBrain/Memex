import moment from 'moment'
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { remoteFunction } from 'src/util/webextensionRPC'
// import analytics from 'src/analytics'
// import AutomaticBackupButton from '../components/overview-automatic-backup-button'
// import OnboardingBackupMode from '../components/onboarding-backup-mode'
// import {
//     redirectToAutomaticBackupPurchase,
//     redirectToAutomaticBackupCancellation,
// } from '../utils'
// import { ToggleSwitch } from 'src/common-ui/components'
import SmallButton from '../components/small-button'
import LoadingBlocker from '../components/loading-blocker'
import RestoreConfirmation from '../components/restore-confirmation'
import { browser } from 'webextension-polyfill-ts'

const styles = require('../styles.css')
const localStyles = require('./overview.css')

interface Props {
    onBackupRequested: (...args: any[]) => any
    onRestoreRequested: (...args: any[]) => any
    onBlobPreferenceChange: (...args: any[]) => any
    onPaymentRequested: (...args: any[]) => any
}

export default class OverviewContainer extends React.Component<Props> {
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
    }

    async componentDidMount() {
        // todo: (ch): remove?
        // await remoteFunction('maybeCheckAutomaticBakupEnabled')()
        const backupTimes = await remoteFunction('getBackupTimes')()
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        const backupLocation = await remoteFunction('getBackendLocation')()
        const automaticBackupEnabled = await remoteFunction(
            'isAutomaticBackupEnabled',
        )()
        let showWarning = false
        if (!hasInitialBackup && automaticBackupEnabled) {
            showWarning = true
        }
        this.setState({
            automaticBackupEnabled,
            backupTimes,
            hasInitialBackup,
            backupLocation,
            showWarning,
        })
    }

    handleToggle = () => {
        const blobPreference = !this.state.blobPreference
        this.props.onBlobPreferenceChange(blobPreference)
        this.setState({
            blobPreference,
        })
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

                <p className={styles.header2}>
                    <strong>STATUS</strong>
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
                                            ? moment(
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
                {this.state.hasInitialBackup ? (
                    <div>
                        <p className={styles.header2}>
                            <strong>SETTINGS</strong>
                        </p>
                        <div className={styles.option}>
                            <span className={styles.name}>
                                {this.state.automaticBackupEnabled
                                    ? 'Automatic Backups Enabled'
                                    : 'Enable Automatic Backups'}
                            </span>
                            // TODO: (ch) this doesn't seem useful, maybe this
                            combination isn't used, only use one module, //
                            currently in the onboarding
                            {!this.state.automaticBackupEnabled && (
                                <SmallButton
                                    extraClass={localStyles.right}
                                    onClick={() => {
                                        // todo: open upgrade flow with redirect back here
                                    }}
                                    color={'darkblue'}
                                >
                                    {'Upgrade'}
                                </SmallButton>
                            )}
                            <span
                                className={classNames(
                                    styles.subname,
                                    localStyles.limitWidth,
                                )}
                            >
                                Worry-free. Automatically backs up your data
                                every 15 minutes.
                            </span>
                            <p className={styles.optionLine}>
                                <span className={styles.name}>
                                    Backup Location
                                </span>
                                <span
                                    onClick={() =>
                                        this.props.onBackupRequested(true)
                                    }
                                    className={localStyles.location}
                                >
                                    {this.state.backupLocation === 'local'
                                        ? 'Your Computer'
                                        : 'Google Drive'}
                                    <span className={localStyles.change}>
                                        change
                                    </span>
                                </span>
                            </p>
                        </div>
                    </div>
                ) : null}
                {!this.state.hasInitialBackup &&
                    this.state.automaticBackupEnabled && (
                        <div>
                            <p className={styles.header2}>
                                <strong>SETTINGS</strong>
                            </p>
                            <div className={styles.option}>
                                <span className={styles.name}>
                                    Automatic Backups Enabled
                                </span>
                                <SmallButton
                                    extraClass={localStyles.right}
                                    onClick={() => {
                                        window.open(
                                            'https://worldbrain.io/community/view-subscription/',
                                            '_blank',
                                        )
                                    }}
                                    color={'red'}
                                >
                                    Cancel
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
                        </div>
                    )}
                <div>
                    <p className={styles.header2}>
                        <strong>RESTORE </strong>
                    </p>
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
                            Restoring will <b>replace</b> all current data with
                            a backup.
                        </span>
                    </div>
                    <div className={styles.option}>
                        <span className={styles.name}>Restore &amp; Merge</span>
                        <SmallButton
                            onClick={() =>
                                browser.tabs.create({
                                    url:
                                        'https://worldbrain.io/crowdfunding-memex',
                                    active: true,
                                })
                            }
                            extraClass={localStyles.right}
                            color="white"
                        >
                            Contribute
                        </SmallButton>
                        <br />
                        <span
                            className={classNames(
                                styles.subname,
                                localStyles.limitWidth,
                            )}
                        >
                            Merge the data you've backed up into the data
                            currently present in your extension. We currently
                            don't have the resources to build this. Help us to
                            get there!
                        </span>
                    </div>
                </div>
            </div>
        )
    }
}
