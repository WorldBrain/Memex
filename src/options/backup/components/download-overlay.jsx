import React from 'react'
import PropTypes from 'prop-types'
import Styles from './download-overlay.css'

export function DownloadOverlay(props) {
    return !props.disabled ? (
        <div>
            <div className={Styles.box}>
                <h3 className={Styles.header}>
                    Download the Memex Backup App to continue
                </h3>
                <p className={Styles.description}>
                    To enable smooth local backups, you need to install Memex
                    <br />
                    Backup App. Come back when you started it.
                </p>
                <div className={Styles.linkbox}>
                    <a
                        href="https://github.com/WorldBrain/local-backup-server/releases/download/v0.2-alpha/local-backup-server-win.exe"
                        target="_blank"
                    >
                        <img className={Styles.logo} src={'img/github.png'} />
                    </a>
                    <a
                        href="https://github.com/WorldBrain/local-backup-server/releases/download/v0.2-alpha/local-backup-server-macos"
                        target="_blank"
                    >
                        <img className={Styles.logo} src={'img/github.png'} />
                    </a>
                    <a
                        href="https://github.com/WorldBrain/local-backup-server/releases/download/v0.2-alpha/local-backup-server-linux"
                        target="_blank"
                    >
                        <img className={Styles.logo} src={'img/github.png'} />
                    </a>
                </div>
                <div className={Styles.buttonbox}>
                    <div
                        className={Styles.colorbutton}
                        onClick={() => {
                            props.onClick('continue')
                        }}
                    >
                        Continue
                    </div>
                    <div
                        className={Styles.greybutton}
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
