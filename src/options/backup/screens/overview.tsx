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
import AutomaticPricing from '../components/automatic-pricing'
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
        // upgradeBillingPeriod: null,
        showRestoreConfirmation: false,
        backupLocation: null,
        blobPreference: true,
        /* Pricing */
        showPricing: false,
        billingPeriod: null,
    }

    async componentDidMount() {
        await remoteFunction('maybeCheckAutomaticBakupEnabled')()
        const backupTimes = await remoteFunction('getBackupTimes')()
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        const backupLocation = await remoteFunction('getBackendLocation')()
        this.setState({
            automaticBackupEnabled: await remoteFunction(
                'isAutomaticBackupEnabled',
            )(),
            backupTimes,
            hasInitialBackup,
            backupLocation,
        })
    }

    handleToggle = () => {
        const blobPreference = !this.state.blobPreference
        this.props.onBlobPreferenceChange(blobPreference)
        this.setState({
            blobPreference,
        })
    }

    onPaymentRequested = e => {
        e.preventDefault()
        const { billingPeriod } = this.state
        this.props.onPaymentRequested({ billingPeriod })
    }

    render() {
        if (!this.state.backupTimes) {
            return <LoadingBlocker />
        }

        return (
            <div>
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
                                    Last backup:{' '}
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
                                <span className={styles.name}>
                                    Next backup:{' '}
                                </span>
                                <span className={localStyles.time}>
                                    {this.state.backupTimes.nextBackup !==
                                    'running'
                                        ? moment(
                                              this.state.backupTimes.nextBackup,
                                          ).fromNow()
                                        : 'in progress'}
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
                            <SmallButton
                                extraClass={localStyles.right}
                                onClick={() => {
                                    if (!this.state.automaticBackupEnabled) {
                                        this.setState({ showPricing: true })
                                    }
                                }}
                                color={
                                    this.state.automaticBackupEnabled
                                        ? 'green'
                                        : 'darkblue'
                                }
                            >
                                {this.state.automaticBackupEnabled
                                    ? 'Upgraded'
                                    : 'Upgrade'}
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
                            {this.state.showPricing ? (
                                <div className={localStyles.pricing}>
                                    <AutomaticPricing
                                        mode="automatic"
                                        billingPeriod={this.state.billingPeriod}
                                        onBillingPeriodChange={billingPeriod =>
                                            this.setState({ billingPeriod })
                                        }
                                    />
                                    {this.state.showPricing &&
                                    this.state.billingPeriod ? (
                                        <div className={localStyles.payConfirm}>
                                            <SmallButton
                                                color="green"
                                                onClick={
                                                    this.onPaymentRequested
                                                }
                                            >
                                                Pay now
                                            </SmallButton>
                                            <span
                                                className={
                                                    localStyles.cancelButton
                                                }
                                                onClick={() =>
                                                    this.setState({
                                                        showPricing: false,
                                                    })
                                                }
                                            >
                                                Cancel
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
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
