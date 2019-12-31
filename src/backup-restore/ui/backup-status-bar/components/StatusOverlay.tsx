import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
import ToggleSwitch from '../../../../common-ui/components/ToggleSwitch'

import ConfirmModalBtn from '../../../../common-ui/components/ConfirmModalBtn'
import { BackupTimes } from 'src/backup-restore/types'
const styles = require('./StatusOverlay.css')

interface Props {
    header?: string
    crossIcon: string
    message?: string
    lastBackup?: BackupTimes['lastBackup']
    nextBackup?: BackupTimes['nextBackup']
    buttonUrl?: string
    errorMessage?: string
    buttonText?: string
    isAutomaticBackupEnabled: boolean
    isAutomaticBackupAllowed: boolean
    onAutomaticBackupSelect: any
    UIstate?: string
}

export default class StatusOverlay extends PureComponent<Props> {
    static DEF_ROOT_EL = 'div'

    static defaultProps = {
        rootEl: StatusOverlay.DEF_ROOT_EL,
    }
    overlayRoot: any

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
        const {
            header,
            message,
            lastBackup,
            nextBackup,
            buttonUrl,
            errorMessage,
            crossIcon,
            buttonText,
            isAutomaticBackupEnabled,
            isAutomaticBackupAllowed,
            onAutomaticBackupSelect,
        } = this.props
        return ReactDOM.createPortal(
            <div>
                <div className={styles.overlay}>
                    {header && (
                        <div className={styles.overlayHeader}>{header}</div>
                    )}

                    {message && (
                        <div className={styles.description}>
                            <span className={styles.descInfo}>{message}</span>
                        </div>
                    )}
                    {errorMessage && (
                        <div className={styles.errorMessage}>
                            <span className={styles.errorDescInfo}>
                                {errorMessage}
                            </span>
                        </div>
                    )}

                    {this.props.UIstate === 'autoBackup' ? null : (
                        <div className={styles.timer}>
                            {lastBackup && (
                                <div className={styles.backup}>
                                    <span>Last Backup:</span>
                                    <span>
                                        {lastBackup === 'Never' && <b>Never</b>}
                                        {lastBackup === 'running' && (
                                            <b>Running</b>
                                        )}
                                        {lastBackup !== 'Never' &&
                                            lastBackup !== 'running' && (
                                                <b>
                                                    {moment(
                                                        lastBackup,
                                                    ).fromNow()}
                                                </b>
                                            )}
                                    </span>
                                </div>
                            )}

                            {lastBackup && (
                                <div className={styles.bottomBorder} />
                            )}

                            {nextBackup &&
                                isAutomaticBackupAllowed &&
                                isAutomaticBackupEnabled && (
                                    <div className={styles.backup}>
                                        <span>Next Backup:</span>
                                        <span>
                                            <b>
                                                {moment(nextBackup).fromNow()}
                                            </b>
                                        </span>
                                    </div>
                                )}

                            {isAutomaticBackupEnabled ? null : (
                                <div
                                    className={styles.backup}
                                    onClick={onAutomaticBackupSelect}
                                >
                                    <span>Automatic Backup:</span>
                                    <ToggleSwitch
                                        defaultValue={isAutomaticBackupEnabled}
                                        onChange={
                                            isAutomaticBackupAllowed
                                                ? () => onAutomaticBackupSelect
                                                : () => false
                                        }
                                        isChecked={
                                            isAutomaticBackupAllowed
                                                ? undefined
                                                : false
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {this.props.children}

                    {buttonText && (
                        <div className={styles.button}>
                            <ConfirmModalBtn href={buttonUrl}>
                                {buttonText}
                            </ConfirmModalBtn>
                        </div>
                    )}
                </div>
            </div>,
            this.overlayRoot,
        )
    }
}
