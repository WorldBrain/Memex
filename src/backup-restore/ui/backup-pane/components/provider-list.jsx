import React from 'react'
import PropTypes from 'prop-types'
import Styles from './provider-list.css'

const settingsStyle = require('src/options/settings/components/settings.css')

export function ProviderList({ onChange, backupPath, handleChangeBackupPath }) {
    return (
        <div>
            <form className={Styles.form}>
                <label className={Styles.label}>
                    <div className={Styles.option}>
                        <input
                            type="radio"
                            name="backend-select"
                            onChange={() => onChange('local')}
                        />
                        <div className={Styles.textBlock}>
                            <p className={settingsStyle.infoText}>
                                Backup your data locally and use any cloud
                                provider with sync folders (e.g. Dropbox,
                                Spideroak, GDrive){' '}
                            </p>
                            {backupPath !== null ? (
                                <button
                                    className={Styles.destination}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleChangeBackupPath()
                                    }}
                                >
                                    <span className={Styles.folderIcon} />
                                    {backupPath && backupPath.length ? (
                                        <p className={Styles.pathString}>
                                            {backupPath}{' '}
                                            <span className={Styles.change}>
                                                click to change path
                                            </span>
                                        </p>
                                    ) : (
                                        <p className={Styles.select}>
                                            SELECT DESTINATION FOLDER
                                        </p>
                                    )}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </label>
                {/* <label className={Styles.label}>
                    <div className={Styles.option}>
                        <input
                            type="radio"
                            name="backend-select"
                            onChange={() => onChange('google-drive')}
                        />
                        <div className={Styles.textBlock}>
                            <div className={Styles.providerTitle}>
                                Google Drive
                                <span>
                                    <img
                                        className={Styles.logo}
                                        src={'img/google-drive.png'}
                                    />
                                </span>
                            </div>
                            <p className={settingsStyle.infoText}>
                                Use the same Google Account as the one logged
                                into your browser profile. (creates a hidden
                                folder)
                                <a
                                    className={Styles.link}
                                    target="_blank"
                                    href="https://worldbrain.io/tutorials/backups"
                                >
                                    {' '}
                                    Learn More ▸
                                </a>
                            </p>
                        </div>
                    </div>
                </label> */}
            </form>
        </div>
    )
}

ProviderList.propTypes = {
    onChange: PropTypes.func.isRequired,
    backupPath: PropTypes.string,
    handleChangeBackupPath: PropTypes.func.isRequired,
}
