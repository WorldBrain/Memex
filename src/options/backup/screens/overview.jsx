import moment from 'moment'
import React from 'react'
import cx from 'classnames'
import { remoteFunction } from 'src/util/webextensionRPC'
import AutomaticBackupButton from '../components/overview-automatic-backup-button'
import Styles from '../styles.css'
import localStyles from './overview.css'
import { redirectToAutomaticBackupPurchase } from '../utils'

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
                <p className={Styles.header2}>
                    <strong>SETTINGS </strong>
                </p>
                <div className={Styles.option}>
                    <span className={Styles.name}>Automatic Backup</span>
                    <span className={cx(localStyles.button)}>
                        {this.state.automaticBackupEnabled !== null && (
                            <AutomaticBackupButton
                                automaticBackupEnabled={
                                    this.state.automaticBackupEnabled
                                }
                                onUpgrade={() => {
                                    redirectToAutomaticBackupPurchase()
                                }}
                                onCancel={() => {
                                    console.log('cancel')
                                }}
                            />
                        )}
                    </span>
                    <br />
                    <span className={Styles.subname}>
                        Worry-free backups every 15 minutes.
                    </span>
                </div>

                <div className={Styles.option}>
                    <span className={Styles.name}>Delete Backup</span>
                    <span className={localStyles.button}>
                        <span className={cx(Styles.label, Styles.labelFree)}>
                            Tutorial
                        </span>
                    </span>
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
                            {moment(
                                this.state.backupTimes.nextBackup,
                            ).fromNow()}
                        </span>
                    </div>
                )}
                <div>
                    <p className={Styles.header2}>
                        <strong>RESTORE </strong>
                    </p>
                    <div className={Styles.option}>
                        <span className={Styles.name}>Coming Very Soon</span>
                        <span className={localStyles.button}>
                            <span
                                className={cx(Styles.label, Styles.labelFree)}
                            >
                                Chip in 10€
                            </span>
                        </span>
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
