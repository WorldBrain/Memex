import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import { browser } from 'webextension-polyfill-ts'
import moment from 'moment'
import { features, sync } from 'src/util/remote-functions-background'
import ToggleSwitch from '../../../../common-ui/components/ToggleSwitch'
import { remoteFunction } from 'src/util/webextensionRPC'
import { SyncDevice } from 'src/sync/components/types'

import ConfirmModalBtn from '../../../../common-ui/components/ConfirmModalBtn'
import { BackupTimes } from 'src/backup-restore/types'
import SyncNowOverlayPaneContainer from 'src/sync/components/device-list/SyncNowOverlayPane'
const styles = require('./StatusOverlay.css')
const settingsStyle = require('src/options/settings/components/settings.css')
import {
    WhiteSpacer20,
    WhiteSpacer10,
} from 'src/common-ui/components/design-library/typography'
import { LoadingIndicator } from 'src/common-ui/components'

interface Props {
    header?: string
    crossIcon: string
    message?: string
    lastBackup?: BackupTimes['lastBackup']
    nextBackup?: BackupTimes['nextBackup']
    buttonUrl?: string
    errorMessage?: string
    buttonText?: string
    isAutomaticBackupAllowed: boolean
    onAutomaticBackupSelect: any
    UIstate?: string
}

export default class StatusOverlay extends PureComponent<Props> {
    state = {
        hasInitialBackup: false,
        automaticBackupEnabled: null,
        isLoading: true,
    }

    static DEF_ROOT_EL = 'div'

    static defaultProps = {
        rootEl: StatusOverlay.DEF_ROOT_EL,
    }
    overlayRoot: any

    constructor(props) {
        super(props)
        this.overlayRoot = document.createElement(props.rootEl)
    }

    async loadingStates() {
        setTimeout(() => {
            this.setState({
                isLoading: false,
            })
        }, 300)
    }

    async componentDidMount() {
        document.body.appendChild(this.overlayRoot)
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        const automaticBackupEnabled = await remoteFunction(
            'isAutomaticBackupEnabled',
        )()
        this.loadingStates()

        this.setState({
            automaticBackupEnabled,
            hasInitialBackup,
        })
    }

    componentWillUnmount() {
        if (document.body.contains(this.overlayRoot)) {
            document.body.removeChild(this.overlayRoot)
        }

        this.setState({
            isLoading: false,
        })
    }

    onBackupSetupRequested() {
        window.open(`${browser.extension.getURL('/options.html')}#/backup`)
    }

    enableAutomaticBackup() {
        if (this.state.hasInitialBackup === true) {
            localStorage.setItem('backup.automatic-backups-enabled', 'true')
            this.setState({ automaticBackupEnabled: true })
        }
        if (!this.state.hasInitialBackup) {
            window.location.href = `${browser.extension.getURL(
                '/options.html',
            )}#/backup`
        }
    }

    disableAutomaticBackup() {
        localStorage.setItem('backup.automatic-backups-enabled', 'false')
        this.setState({ automaticBackupEnabled: false })
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
            onAutomaticBackupSelect,
        } = this.props
        return ReactDOM.createPortal(
            <div>
                <div className={styles.overlay}>
                    {this.state.isLoading && (
                        <div className={styles.loadingBlocker}>
                            <LoadingIndicator />
                        </div>
                    )}
                    <div className={styles.statusSection}>
                        <div className={styles.syncSection}>
                            <SyncNowOverlayPaneContainer />
                        </div>
                        <WhiteSpacer20 />
                        <div className={styles.backupSection}>
                            <div className={settingsStyle.buttonArea}>
                                <div className={settingsStyle.sectionTitle}>
                                    {header && <span>{header}</span>}
                                </div>
                                {this.props.children}
                            </div>
                            <WhiteSpacer10 />
                            <div className={styles.infoBox}>
                                <div>
                                    {message && (
                                        <div className={styles.description}>
                                            <span
                                                className={
                                                    settingsStyle.infoText
                                                }
                                            >
                                                {message}
                                            </span>
                                        </div>
                                    )}
                                    {errorMessage && (
                                        <div className={styles.showWarning}>
                                            <span
                                                className={
                                                    styles.showWarningText
                                                }
                                            >
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
                            </div>
                            <WhiteSpacer10 />
                            {this.props.UIstate === 'autoBackup' ? null : (
                                <div className={styles.timer}>
                                    {lastBackup && (
                                        <div className={styles.backup}>
                                            <span>Last Backup:</span>
                                            <span>
                                                {lastBackup === 'Never' && (
                                                    <b>Never</b>
                                                )}
                                                {lastBackup === 'running' && (
                                                    <b>Running</b>
                                                )}
                                                {lastBackup !== 'Never' &&
                                                    lastBackup !==
                                                        'running' && (
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
                                        this.state.automaticBackupEnabled && (
                                            <div className={styles.backup}>
                                                <span>Next Backup:</span>
                                                <span>
                                                    <b>
                                                        {moment(
                                                            nextBackup,
                                                        ).fromNow()}
                                                    </b>
                                                </span>
                                            </div>
                                        )}

                                    <div className={styles.backup}>
                                        <span>Automatic Backup:</span>
                                        <ToggleSwitch
                                            defaultValue={
                                                this.state
                                                    .automaticBackupEnabled
                                            }
                                            onChange={
                                                this.state
                                                    .automaticBackupEnabled
                                                    ? () =>
                                                          this.disableAutomaticBackup()
                                                    : () =>
                                                          this.enableAutomaticBackup()
                                            }
                                            isChecked={
                                                this.state
                                                    .automaticBackupEnabled
                                                    ? true
                                                    : false
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>,
            this.overlayRoot,
        )
    }
}
