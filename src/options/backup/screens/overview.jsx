import moment from 'moment'
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { remoteFunction } from 'src/util/webextensionRPC'
import analytics from 'src/analytics'
import AutomaticBackupButton from '../components/overview-automatic-backup-button'
import OnboardingBackupMode from '../components/onboarding-backup-mode'
import Styles from '../styles.css'
import localStyles from './overview.css'
import {
    redirectToAutomaticBackupPurchase,
    redirectToAutomaticBackupCancellation,
} from '../utils'
import { PrimaryButton } from '../components/primary-button'

export default class OverviewContainer extends React.Component {
    static propTypes = {
        onBackupRequested: PropTypes.func.isRequired,
    }

    state = {
        automaticBackupEnabled: null,
        backupTimes: null,
        showAutomaticUpgradeDetails: false,
        upgradeBillingPeriod: null,
    }

    async componentDidMount() {
        console.log('before')
        const backupTimes = await remoteFunction('getBackupTimes')()
        this.setState({
            automaticBackupEnabled: await remoteFunction(
                'isAutomaticBackupEnabled',
            )(),
            backupTimes,
        })
        console.log('after', backupTimes)
    }

    render() {
        if (!this.state.backupTimes) {
            return null
        }

        console.log(this.state.backupTimes.nextBackup)

        return (
            <div>
                <p className={Styles.header2}>
                    <strong>SETTINGS </strong>
                </p>
                <div className={Styles.option}>
                    <span className={Styles.name}>Automatic Backup</span>
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
                    <span className={Styles.subname}>
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
                </div>

                <div className={Styles.option}>
                    <span className={Styles.name}>Delete Backup</span>
                    <a
                        target="_blank"
                        href="https://worldbrain.helprace.com/i100-delete-your-backup-and-start-over"
                    >
                        <span className={localStyles.button}>
                            <span
                                className={classNames(
                                    Styles.label,
                                    Styles.labelFree,
                                )}
                            >
                                Tutorial
                            </span>
                        </span>
                    </a>
                    <br />
                </div>

                <p className={Styles.header2}>
                    <strong>STATUS </strong>
                </p>
                <div className={localStyles.statusLine}>
                    <span className={Styles.name}>Last backup: </span>
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
                        <span className={Styles.name}>Next backup: </span>
                        <span className={localStyles.time}>
                            {this.state.backupTimes.nextBackup !== 'running'
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
                <div>
                    <p className={Styles.header2}>
                        <strong>RESTORE </strong>
                    </p>
                    <div className={Styles.option}>
                        <span className={Styles.name}>Coming Very Soon</span>
                        <a
                            target="_blank"
                            href="https://worldbrain.io/crowdfunding-memex"
                        >
                            <span className={localStyles.button}>
                                <span
                                    className={classNames(
                                        Styles.label,
                                        Styles.labelFree,
                                    )}
                                >
                                    Chip in 10€
                                </span>
                            </span>
                        </a>
                        <br />
                        <span className={Styles.subname}>
                            Support our development and get back 40€ worth of
                            premium credits
                        </span>
                    </div>
                </div>
            </div>
        )
    }
}
