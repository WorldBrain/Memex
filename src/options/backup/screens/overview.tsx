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
import { PrimaryButton } from '../components/primary-button'
import LoadingBlocker from '../components/loading-blocker'
import RestoreConfirmation from '../components/restore-confirmation'

const styles = require('../styles.css')
const localStyles = require('./overview.css')

interface Props {
    onBackupRequested: (...args: any[]) => any
    onRestoreRequested: (...args: any[]) => any
}

export default class OverviewContainer extends React.Component<Props> {
    state = {
        automaticBackupEnabled: null,
        backupTimes: null,
        hasInitialBackup: false,
        showAutomaticUpgradeDetails: false,
        upgradeBillingPeriod: null,
        showRestoreConfirmation: false,
    }

    async componentDidMount() {
        await remoteFunction('maybeCheckAutomaticBakupEnabled')()
        const backupTimes = await remoteFunction('getBackupTimes')()
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        this.setState({
            automaticBackupEnabled: await remoteFunction(
                'isAutomaticBackupEnabled',
            )(),
            backupTimes,
            hasInitialBackup,
        })
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

                {/* <p className={styles.header2}>
                    <strong>SETTINGS </strong>
                </p>
                <div className={styles.option}>
                    <span className={styles.name}>Automatic Backup</span>
                    <span className={classNames(localStyles.button)}>
                        {this.state.automaticBackupEnabled !== null &&
                            !this.state.showAutomaticUpgradeDetails && (
                                <AutomaticBackupButton
                                    automaticBackupEnabled={
                                        this.state.automaticBackupEnabled
                                    }
                                    onUpgrade={() => {
                                        analytics.trackEvent(
                                            {
                                                category: 'Backup',
                                                action:
                                                    'overview-expand-auto-upgrade',
                                            },
                                            true,
                                        )
                                        this.setState({
                                            showAutomaticUpgradeDetails: true,
                                        })
                                    }}
                                    onCancel={() => {
                                        redirectToAutomaticBackupCancellation()
                                    }}
                                />
                            )}
                    </span>
                    <br />
                    <span className={styles.subname}>
                        Worry-free backups every 15 minutes.
                    </span>
                    {this.state.showAutomaticUpgradeDetails && (
                        <div style={{ marginTop: '20px' }}>
                            <OnboardingBackupMode
                                disableModeSelection
                                onBillingPeriodChange={upgradeBillingPeriod =>
                                    this.setState({ upgradeBillingPeriod })
                                }
                            />
                            <PrimaryButton
                                onClick={() =>
                                    redirectToAutomaticBackupPurchase(
                                        this.state.upgradeBillingPeriod,
                                    )
                                }
                                disabled={!this.state.upgradeBillingPeriod}
                            >
                                Purchase
                            </PrimaryButton>
                        </div>
                    )}
                </div> */}

                {/* <div className={styles.option}>
                    <span className={styles.name}>Delete Backup</span>
                    <a
                        target="_blank"
                        href="https://worldbrain.helprace.com/i100-delete-your-backup-and-start-over"
                    >
                        <span className={localStyles.button}>
                            <span
                                className={classNames(
                                    styles.label,
                                    styles.labelFree,
                                )}
                            >
                                Tutorial
                            </span>
                        </span>
                    </a>
                    <br />
                </div> */}

                <p className={styles.header2}>
                    <strong>STATUS</strong>
                </p>
                {!this.state.hasInitialBackup ? (
                    <div className={localStyles.statusLine}>
                        <p>You haven't set up any backups yet.</p>
                        <button
                            className={localStyles.startWizard}
                            onClick={this.props.onBackupRequested}
                        >
                            Start wizard
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className={localStyles.statusLine}>
                            <span className={styles.name}>Last backup: </span>
                            <span className={localStyles.time}>
                                {this.state.backupTimes.lastBackup
                                    ? moment(
                                          this.state.backupTimes.lastBackup,
                                      ).fromNow()
                                    : "You haven't made any backup yet"}
                            </span>
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
                        <PrimaryButton onClick={this.props.onBackupRequested}>
                            {this.state.backupTimes.nextBackup !== 'running'
                                ? 'Backup Now'
                                : 'Go to Backup'}
                        </PrimaryButton>
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
                        <a
                            onClick={() =>
                                this.setState({ showRestoreConfirmation: true })
                            }
                        >
                            <span className={localStyles.button}>
                                <span
                                    className={classNames(
                                        styles.label,
                                        styles.labelFree,
                                    )}
                                >
                                    RESTORE
                                </span>
                            </span>
                        </a>
                        <br />
                        <span
                            className={classNames(
                                styles.subname,
                                localStyles.limitWidth,
                            )}
                        >
                            This will replace all present data and replace
                            everything from backup.
                        </span>
                    </div>
                    <div className={styles.option}>
                        <span className={styles.name}>Restore &amp; Merge</span>
                        <a
                            target="_blank"
                            href="https://worldbrain.io/crowdfunding-memex"
                        >
                            <span className={localStyles.button}>
                                <span
                                    className={classNames(
                                        styles.label,
                                        styles.labelContribute,
                                    )}
                                >
                                    CONTRIBUTE
                                </span>
                            </span>
                        </a>
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
