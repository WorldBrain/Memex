import React from 'react'
import PropTypes from 'prop-types'
import Styles from './overlay.css'
import cx from 'classnames'

export default function DownloadOverlay(props) {
    return !props.disabled ? (
        <div>
            <div className={Styles.box}>
                <h3 className={Styles.header}>
                    Download Memex' Backup App to continue.
                </h3>
                <p className={Styles.description}>
                        Start it & pick a backup folder. Then return to continue your backup. <br/><a className={Styles.link} target="_blank" href="https://www.notion.so/worldbrain/Backup-Restore-locally-and-to-any-cloud-provider-7b7e470247c548eeb3e9601a03e246a7">Learn More ▸</a>
                </p>
                <div className={Styles.linkbox}>
                    <a
                        href="https://github.com/WorldBrain/local-backup-server/releases/download/v0.2-alpha/local-backup-server-win.exe"
                        target="_blank"
                    >
                        <img className={Styles.logo} src={'img/windows_logo.svg'} />
                    </a>
                    <a
                        href="https://github.com/WorldBrain/local-backup-server/releases/download/v0.2-alpha/local-backup-server-macos"
                        target="_blank"
                    >
                        <img className={Styles.logo} src={'img/apple_logo.svg'} />
                    </a>
                    <a
                        href="https://github.com/WorldBrain/local-backup-server/releases/download/v0.2-alpha/local-backup-server-linux"
                        target="_blank"
                    >
                        <img className={cx(Styles.logo, Styles.linux)} src={'img/linux_logo.svg'} />
                    </a>
                </div>
                <div className={Styles.buttonbox}>
                    <div
                        className={Styles.continueButton}
                        onClick={() => {
                            props.onClick('continue')
                        }}
                    >
                        I'm ready!
                    </div>
                    <div
                        className={Styles.cancelButton}
                        onClick={() => {
                            props.onClick('cancel')
                        }}
                    >
                        Cancel
                    </div>
                </div>
            </div>
        </div>
    ) : null
}

DownloadOverlay.propTypes = {
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
}
