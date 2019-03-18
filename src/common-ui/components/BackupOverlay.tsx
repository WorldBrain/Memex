import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import moment from 'moment'
import ToggleSwitch from 'src/common-ui/components/ToggleSwitch'

import ConfirmModalBtn from './ConfirmModalBtn'
const styles = require('./BackupOverlay.css')

interface Props {
    header: string
    checkedIcon: string
    crossIcon: string
    message: string
    automaticBackup: boolean
    lastBackup: string
    nextBackup: string
    buttonUrl: string
    errorMessage: string
    buttonText: string
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
            checkedIcon,
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
                            <span>
                                <img
                                    src={crossIcon}
                                    className={styles.crossIcon}
                                />
                            </span>
                            <span className={styles.errorDescInfo}>
                                {errorMessage}
                            </span>
                        </div>
                    )}
                    {lastBackup && (
                        <div className={styles.backup}>
                            <span>Last Backup:</span>
                            <span>
                                <b>{moment(lastBackup).fromNow()}</b>
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
                            {/* 5 === 5 ? (
                                <span>
                                    <img
                                        src={this.props.checkedIcon}
                                        className={styles.checkedIcon}
                                    />
                                </span>
                            ) : (
                                <span>
                                    <img
                                        src={this.props.crossIcon}
                                        className={styles.crossIcon}
                                    />
                                </span>
                            ) */}
                            <ToggleSwitch
                                onChange={() => {
                                    console.log('hello')
                                }}
                            />
                        </div>
                    )}

                    {this.props.children}

                    {buttonUrl && (
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
