import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import moment from 'moment'

import ConfirmModalBtn from './ConfirmModalBtn'
const styles = require('./BackupOverlay.css')

interface Props {
    hasInitBackup: boolean
    backupTimes: any
    isAutomaticBackupEnabled: boolean
    checkedIcon: string
    crossIcon: string
    description: string
    backupUrl: string
    backupStatus: any
}

export default class BackupOverlay extends PureComponent<Props> {
    static DEF_ROOT_EL = 'div'

    static propTypes = {
        rootEl: PropTypes.string,
        hasInitBackup: PropTypes.bool,
        backupTimes: PropTypes.object,
    }

    static defaultProps = {
        rootEl: BackupOverlay.DEF_ROOT_EL,
    }

    constructor(props) {
        super(props)
        this.overlayRoot = document.createElement(props.rootEl)
    }

    componentDidMount() {
        document.body.appendChild(this.overlayRoot)
    }

    componentWillUnmount() {
        if (document.body.contains(this.overlayRoot)) {
            document.body.removeChild(this.overlayRoot)
        }
    }

    render() {
        // const nextBackup =
        //     this.props.backupStatus &&
        //     this.props.backupTimes &&
        //     this.props.backupStatus.state === 'no_backup'
        //         ? null
        //         : moment(this.props.backupTimes.nextBackup).fromNow()
        const {
            backupTimes,
            backupStatus,
            hasInitBackup,
            isAutomaticBackupEnabled,
            backupUrl,
            checkedIcon,
            crossIcon,
        } = this.props
        const hasNextBackup = backupTimes
            ? !(backupTimes.nextBackup === null)
            : null
        const nextBackup = hasNextBackup
            ? backupStatus && backupStatus.state === 'no_backup'
                ? null
                : moment(backupTimes.nextBackup).fromNow()
            : null
        return ReactDOM.createPortal(
            <>
                <div className={styles.overlay}>
                    <div className={styles.backup}>
                        <span>Last Backup:</span>
                        <span>
                            <b>
                                {hasInitBackup
                                    ? `${moment(
                                          backupTimes.lastBackup,
                                      ).fromNow()}`
                                    : 'Never'}
                            </b>
                        </span>
                    </div>
                    {hasNextBackup ? (
                        <div className={styles.backup}>
                            <span>Next Backup:</span>
                            <span>
                                <b>{nextBackup}</b>
                            </span>
                        </div>
                    ) : null}
                    <div className={styles.backup}>
                        <span>Automatic Backup:</span>
                        {isAutomaticBackupEnabled ? (
                            <span>
                                <img
                                    src={checkedIcon}
                                    className={styles.checkedIcon}
                                />
                            </span>
                        ) : (
                            <span>
                                <img
                                    src={crossIcon}
                                    className={styles.crossIcon}
                                />
                            </span>
                        )}
                    </div>
                    <div className={styles.description}>
                        {backupStatus && backupStatus.state === 'success' ? (
                            <span>
                                <img
                                    src={checkedIcon}
                                    className={styles.checkedIcon}
                                />
                            </span>
                        ) : (
                            <span>
                                <img
                                    src={crossIcon}
                                    className={styles.crossIcon}
                                />
                            </span>
                        )}
                        <span className={styles.descInfo}>
                            {backupStatus ? backupStatus.message : null}
                        </span>
                    </div>
                    <div className={styles.button}>
                        <ConfirmModalBtn href={backupUrl}>
                            Backup Now
                        </ConfirmModalBtn>
                    </div>
                </div>
            </>,
            this.overlayRoot,
        )
    }
}
