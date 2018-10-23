import moment from 'moment'
import React from 'react'
import classNames from 'classnames'
import { remoteFunction } from 'src/util/webextensionRPC'
import styles from './overview.css'

export default class OverviewContainer extends React.Component {
    state = { automaticBackupEnabled: null, backupTimes: null }

    async componentDidMount() {
        this.setState({
            automaticBackupEnabled: await remoteFunction(
                'isAutomaticBackupEnabled',
            )(),
            backupTimes: await remoteFunction('getBackupTimes')(),
        })
    }

    render() {
        if (!this.state.backupTimes) {
            return null
        }

        return (
            <div>
                <h2>Settings</h2>
                <div className={styles.settingsSection}>
                    <div>
                        <div className={styles.settingsLabel}>
                            Automatic backup
                        </div>
                        <div className={styles.settingsHelp}>
                            Worry-free. Automatically backs up your data every
                            15 minutes.
                        </div>
                    </div>
                    <div>
                        {this.state.automaticBackupEnabled !== null && (
                            <div
                                className={classNames(
                                    styles.smallButton,
                                    this.state.automaticBackupEnabled &&
                                        styles.dangerButton,
                                )}
                            >
                                {this.state.automaticBackupEnabled && (
                                    <span>Cancel</span>
                                )}
                                {!this.state.automaticBackupEnabled && (
                                    <span>Enable</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.settingsSection}>
                    <div>
                        <div className={styles.settingsLabel}>
                            Delete backup
                        </div>
                    </div>
                    <div>
                        <div className={styles.smallButton}>Tutorial</div>
                    </div>
                </div>
                <h2>Status</h2>
                {this.state.backupTimes.lastBackup && (
                    <div className={styles.statusLine}>
                        <span className={styles.statusLabel}>
                            Last backup:{' '}
                            {moment(
                                this.state.backupTimes.lastBackup,
                            ).fromNow()}
                        </span>
                    </div>
                )}
                {this.state.backupTimes.nextBackup && (
                    <div className={styles.statusLine}>
                        <span className={styles.statusLabel}>
                            Next backup:{' '}
                        </span>
                        {moment(this.state.backupTimes.nextBackup).fromNow()}
                    </div>
                )}
                <h2>Restore</h2>
                <div className={styles.settingsSection}>
                    <div>
                        <div
                            className={classNames(
                                styles.settingsLabel,
                                styles.comingSoon,
                            )}
                        >
                            Coming Very Soon
                        </div>
                        <div className={styles.settingsHelp}>
                            You can back our development and get up to 4.5x of
                            your contribution back in Premium Credits
                        </div>
                    </div>
                    <div>
                        <div
                            className={classNames(
                                styles.smallButton,
                                styles.supportUs,
                            )}
                        >
                            Support
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
