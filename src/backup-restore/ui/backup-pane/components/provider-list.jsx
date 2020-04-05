import React from 'react'
import PropTypes from 'prop-types'
import Styles from './provider-list.css'
import { WhiteSpacer20 } from 'src/common-ui/components/design-library/typography'

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
                            <div className={Styles.providerTitle}>
                                Any cloud provider via local hard drive
                            </div>
                            <p className={settingsStyle.infoText}>
                                Use cloud providers that have a syncing folder
                                on your computer (e.g. Dropbox, Spideroak,
                                GDrive){' '}
                                <a
                                    className={Styles.link}
                                    target="_blank"
                                    href="https://www.notion.so/worldbrain/7dacad9e95b44c5db681033fc264fb59"
                                >
                                    Learn More ▸
                                </a>
                            </p>
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
                <WhiteSpacer20 />
                <label className={Styles.label}>
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
                                Make sure you are trying to backup your data to
                                the same Google Account as the one logged into
                                your browser profile.
                                <a
                                    className={Styles.link}
                                    target="_blank"
                                    href="https://www.notion.so/worldbrain/7dacad9e95b44c5db681033fc264fb59"
                                >
                                    Learn More ▸
                                </a>
                            </p>
                        </div>
                    </div>
                </label>
            </form>
        </div>
    )
}

ProviderList.propTypes = {
    onChange: PropTypes.func.isRequired,
    backupPath: PropTypes.string,
    handleChangeBackupPath: PropTypes.func.isRequired,
}
