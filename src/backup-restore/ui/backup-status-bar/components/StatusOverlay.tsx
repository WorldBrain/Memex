import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
import ToggleSwitch from '../../../../common-ui/components/ToggleSwitch'

import ConfirmModalBtn from '../../../../common-ui/components/ConfirmModalBtn'
import { BackupTimes } from 'src/backup-restore/types'
import SyncNowOverlayPaneContainer from 'src/sync/components/device-list/SyncNowOverlayPane'
const styles = require('./StatusOverlay.css')
const settingsStyle = require('src/options/settings/components/settings.css')
import { WhiteSpacer20, WhiteSpacer10} from 'src/common-ui/components/design-library/typography'


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
                    <div className={styles.syncSection}>
                        <SyncNowOverlayPaneContainer />
                    </div>
                    <WhiteSpacer20/>
                    <div className={styles.backupSection}>
                        <div className={settingsStyle.sectionTitle}>
                                Backup Status: {header && (
                                    <span>{header}</span>
                                )}
                        </div>
                        <WhiteSpacer10/>
                        <div className={settingsStyle.buttonArea}>
                            <div className={styles.infoBox}>
                                <div>
                                    {message && (
                                        <div className={styles.description}>
                                            <span className={settingsStyle.infoText}>{message}</span>
                                        </div>
                                    )}
                                    {(errorMessage) && (
                                        <div className={styles.showWarning}>
                                            <span className={styles.showWarningText}>
                                                {errorMessage}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {buttonText && (
                                    <div className={styles.button}>
                                        <ConfirmModalBtn href={buttonUrl}>
                                            {buttonText}
                                        </ConfirmModalBtn>
                                    </div>
                                )}
                                {this.props.children}
                            </div>
                        </div>
                        <WhiteSpacer10/>
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
                    </div>
                </div>
            </div>,
            this.overlayRoot,
        )
    }
}
