import React from 'react'
import PropTypes from 'prop-types'
import Styles from './provider-list.css'

export function ProviderList({ onChange, backupPath, handleChangeBackupPath }) {
    return (
        <div>
            <p className={Styles.subTitle}>Currently Available</p>
            <form>
                <label>
                    <input
                        type="radio"
                        name="backend-select"
                        onChange={() => onChange('google-drive')}
                    />
                    <span style={{ cursor: 'pointer' }}>
                        <img
                            className={Styles.logo}
                            src={'img/google-drive.png'}
                        />
                        <span className={Styles.title}>Google Drive</span>
                    </span>
                </label>
                <br />
                <label>
                    <input
                        type="radio"
                        name="backend-select"
                        onChange={() => onChange('local')}
                    />
                    <span style={{ cursor: 'pointer' }}>
                        <span className={Styles.title}>Local Backup</span>
                        <p className={Styles.description}>
                            Backup your data locally, or to any cloud provider
                            that has a syncing folder on your
                            <br />
                            computer (e.g. Dropbox, Spideroak, GDrive)
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
            </form>
        </div>
    )
}

ProviderList.propTypes = {
    onChange: PropTypes.func.isRequired,
    backupPath: PropTypes.string,
    handleChangeBackupPath: PropTypes.func.isRequired,
}
