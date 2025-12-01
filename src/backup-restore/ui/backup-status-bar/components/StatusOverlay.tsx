import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'

import ToggleSwitch from '../../../../common-ui/components/ToggleSwitch'
import { remoteFunction } from 'src/util/webextensionRPC'

import ConfirmModalBtn from '../../../../common-ui/components/ConfirmModalBtn'
import { BackupTimes } from 'src/backup-restore/types'
// import SyncNowOverlayPaneContainer from 'src/sync/components/device-list/SyncNowOverlayPane'
import {
    WhiteSpacer20,
    WhiteSpacer10,
} from 'src/common-ui/components/design-library/typography'
import LoadingIndicator from '@worldbrain/memex-common/ts/common-ui/components/loading-indicator'
import { formatTimeFromNow } from '@worldbrain/memex-common/ts/utils/date-time'

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
        globalThis.open(`${chrome.runtime.getURL('/options.html')}#/backup`)
    }

    enableAutomaticBackup() {
        if (this.state.hasInitialBackup === true) {
            localStorage.setItem('backup.automatic-backups-enabled', 'true')
            this.setState({ automaticBackupEnabled: true })
        }
        if (!this.state.hasInitialBackup) {
            globalThis.location.href = `${chrome.runtime.getURL(
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
                <div className="overlay">
                    {this.state.isLoading && (
                        <div className="loadingBlocker">
                            <LoadingIndicator />
                        </div>
                    )}
                    <div className="statusSection">
                        <div className="syncSection">
                            {/* <SyncNowOverlayPaneContainer /> */}
                        </div>
                        <WhiteSpacer20 />
                        <div className="backupSection">
                            <div className="buttonAreaSyncOverlay">
                                <div className="sectionTitle">
                                    {header && <span>{header}</span>}
                                </div>
                                {this.props.children}
                            </div>
                            <WhiteSpacer10 />
                            <div className="infoBox">
                                <div>
                                    {message && (
                                        <div className="description">
                                            <span className={'infoText'}>
                                                {message}
                                            </span>
                                        </div>
                                    )}
                                    {errorMessage && (
                                        <div className="showWarning">
                                            <span className={'showWarningText'}>
                                                {errorMessage}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {buttonText && (
                                    <div className="button">
                                        <ConfirmModalBtn
                                            disabled
                                            href={buttonUrl}
                                        >
                                            {buttonText}
                                        </ConfirmModalBtn>
                                    </div>
                                )}
                            </div>
                            <WhiteSpacer10 />
                            {this.props.UIstate === 'autoBackup' ? null : (
                                <div className="timer">
                                    {lastBackup && (
                                        <div className="backup">
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
                                                            {formatTimeFromNow(
                                                                lastBackup,
                                                            )}
                                                        </b>
                                                    )}
                                            </span>
                                        </div>
                                    )}

                                    {lastBackup && (
                                        <div className="bottomBorder" />
                                    )}
                                    {nextBackup &&
                                        this.state.automaticBackupEnabled && (
                                            <div className="backup">
                                                <span>Next Backup:</span>
                                                <span>
                                                    <b>
                                                        {formatTimeFromNow(
                                                            nextBackup,
                                                        )}
                                                    </b>
                                                </span>
                                            </div>
                                        )}

                                    <div className="backup">
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
