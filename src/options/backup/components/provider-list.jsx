import React from 'react'
import PropTypes from 'prop-types'
import Styles from './provider-list.css'

export function ProviderList({ onChange, backupPath, handleChangeBackupPath }) {
    return (
        <div>
            <form className={Styles.form}>
                <label className={Styles.label}>
                    <input
                        type="radio"
                        name="backend-select"
                        onChange={() => onChange('local')}
                    />
                    <span style={{ cursor: 'pointer' }}>
                        <span className={Styles.title}>Local Backup</span>
                        <p className={Styles.description}>
                            Backup & restore your data locally, or to any cloud provider with a syncing folder on your computer (e.g. Dropbox, Spideroak, GDrive) <a className={Styles.link} target="_blank" href="https://www.notion.so/worldbrain/Backup-Restore-locally-and-to-any-cloud-provider-7b7e470247c548eeb3e9601a03e246a7">Learn More ▸</a>
                        </p>
                    </span>
                    {backupPath !== null ? (
                        <button
                            className={Styles.destination}
                            onClick={e => {
                                e.preventDefault()
                                handleChangeBackupPath()
                            }}
                        >
                            <span className={Styles.folderIcon} />
                            {backupPath && backupPath.length ? (
                                <p>
                                    {backupPath}{' '}
                                    <span className={Styles.change}>
                                        change
                                    </span>
                                </p>
                            ) : (
                                <p className={Styles.select}>
                                    SELECT DESTINATION FOLDER
                                </p>
                            )}
                        </button>
                    ) : null}
                </label>
                <br />
                <label className={Styles.label}>
                    <input
                        type="radio"
                        name="backend-select"
                        onChange={() => onChange('google-drive')}
                    />
                    <span style={{ cursor: 'pointer' }}>
                        <span className={Styles.title}>Google Drive</span>
                        <img
                            className={Styles.logo}
                            src={'img/google-drive.png'}
                        />
                    </span>
                </label>
                <br />
            </form>
        </div>
    )
}

ProviderList.propTypes = {
    onChange: PropTypes.func.isRequired,
    backupPath: PropTypes.string,
    handleChangeBackupPath: PropTypes.func.isRequired,
}
