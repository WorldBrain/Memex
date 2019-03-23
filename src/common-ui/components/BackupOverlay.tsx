import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import moment from 'moment'
import ToggleSwitch from './ToggleSwitch'

import ConfirmModalBtn from './ConfirmModalBtn'
const styles = require('./BackupOverlay.css')

interface Props {
    header: string
    crossIcon: string
    message: string
    automaticBackup: boolean
    lastBackup: number | string
    nextBackup: number | string
    buttonUrl: string
    errorMessage: string
    buttonText: string
    isAutomaticBackupEnabled: boolean
    onAutomaticBackupSelect: any
}

export default class BackupOverlay extends PureComponent<Props> {
    static DEF_ROOT_EL = 'div'

    static propTypes = {
        rootEl: PropTypes.string,
        hasInitBackup: PropTypes.bool,
        backupTimes: PropTypes.object,
        header: PropTypes.string,
        crossIcon: PropTypes.string,
        message: PropTypes.string,
        automaticBackup: PropTypes.bool,
        lastBackup: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        nextBackup: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        buttonUrl: PropTypes.string,
        errorMessage: PropTypes.string,
        buttonText: PropTypes.string,
        isAutomaticBackupEnabled: PropTypes.bool,
        onAutomaticBackupSelect: PropTypes.func,
    }

    static defaultProps = {
        rootEl: BackupOverlay.DEF_ROOT_EL,
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
            automaticBackup,
            lastBackup,
            nextBackup,
            buttonUrl,
            errorMessage,
            crossIcon,
            buttonText,
            isAutomaticBackupEnabled,
            onAutomaticBackupSelect,
        } = this.props
        return ReactDOM.createPortal(
            <>
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
                    {lastBackup && (
                        <div className={styles.backup}>
                            <span>Last Backup:</span>
                            <span>
                                {lastBackup === 'Never' && <b>Never</b>}
                                {lastBackup === 'running' && <b>Running</b>}
                                {lastBackup !== 'Never' &&
                                    lastBackup !== 'running' && (
                                        <b>{moment(lastBackup).fromNow()}</b>
                                    )}
                            </span>
                        </div>
                    )}

                    {lastBackup && <div className={styles.bottomBorder} />}

                    {nextBackup && (
                        <div className={styles.backup}>
                            <span>Next Backup:</span>
                            <span>
                                <b>{moment(nextBackup).fromNow()}</b>
                            </span>
                        </div>
                    )}

                    {nextBackup && <div className={styles.bottomBorder} />}

                    {automaticBackup && (
                        <div className={styles.backup}>
                            <span>Automatic Backup:</span>
                            {!isAutomaticBackupEnabled && (
                                <ToggleSwitch
                                    defaultValue={isAutomaticBackupEnabled}
                                    onChange={onAutomaticBackupSelect}
                                />
                            )}
                            {isAutomaticBackupEnabled && (
                                <ToggleSwitch
                                    isChecked={isAutomaticBackupEnabled}
                                    onChange={onAutomaticBackupSelect}
                                />
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
            </>,
            this.overlayRoot,
        )
    }
}
