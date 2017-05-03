import React, { PropTypes } from 'react'
import classNames from 'classnames'
import styles from '../../options.css'
import localStyles from './Import.css'

const Import = ({
    historyStats, bookmarksStats, onAllowImportHistoryClick, isCheckboxDisabled,
    onAllowImportBookmarksClick, allowImport, downloadEsts, ActionButton, StopButton,
}) => (
    <div>
        <h1 className={styles.routeTitle}>Analyse History & Bookmarks</h1>
        <table className={localStyles.importTable}>
            <thead className={localStyles.importTableHead}>
                <tr className={localStyles.importTableRow}>
                    <td />
                    <td>Browsing History</td>
                    <td>Bookmarks</td>
                </tr>
            </thead>
            <tbody>
                <tr className={localStyles.importTableRow}>
                    <td>Pages already saved</td>
                    <td>{historyStats.saved}</td>
                    <td>{bookmarksStats.saved}</td>
                </tr>
                <tr className={classNames(localStyles.importTableRow, localStyles.importTableRowSepar)}>
                    <td>~ Size on Hard Drive</td>
                    <td>{historyStats.sizeEngaged} MB</td>
                    <td>{bookmarksStats.sizeEngaged} MB</td>
                </tr>

                <tr className={localStyles.importTableRow}>
                    <td>Not yet downloaded</td>
                    <td>{historyStats.notDownloaded}</td>
                    <td>{bookmarksStats.notDownloaded}</td>
                </tr>
                <tr className={localStyles.importTableRow}>
                    <td>~ Size on Hard Drive</td>
                    <td>{historyStats.sizeRequired} MB</td>
                    <td>{bookmarksStats.sizeRequired} MB</td>
                </tr>
                <tr className={localStyles.importTableRow}>
                    <td>~ Time to download</td>
                    <td>{downloadEsts.history}</td>
                    <td>{downloadEsts.bookmarks}</td>
                </tr>
                <tr className={classNames(localStyles.importTableRow, localStyles.actionTableRow)}>
                    <td>Import?</td>
                    <td>
                        <input
                            type='checkbox'
                            name='history'
                            onChange={onAllowImportHistoryClick}
                            checked={allowImport.history}
                            disabled={isCheckboxDisabled}
                        />
                    </td>
                    <td>
                        <input
                            type='checkbox'
                            name='bookmarks'
                            onChange={onAllowImportBookmarksClick}
                            checked={allowImport.bookmarks}
                            disabled={isCheckboxDisabled}
                        />
                    </td>
                </tr>
            </tbody>
        </table>

        <div className={styles.fluidContainer}>
            {ActionButton}
            {StopButton}
        </div>

        <div className={styles.fluidContainer}>
            <span className={classNames(styles.helpText, styles.helpText_right)}>
                Downloading may slow down your browsing experience.<br /> You can pause and resume anytime
            </span>
        </div>
    </div>
)

Import.propTypes = {
    isCheckboxDisabled: PropTypes.bool.isRequired,
    onAllowImportHistoryClick: PropTypes.func.isRequired,
    onAllowImportBookmarksClick: PropTypes.func.isRequired,
    downloadEsts: PropTypes.shape({
        bookmarks: PropTypes.string.isRequired,
        history: PropTypes.string.isRequired,
    }).isRequired,
    allowImport: PropTypes.shape({
        history: PropTypes.bool.isRequired,
        bookmarks: PropTypes.bool.isRequired,
    }).isRequired,
    ActionButton: PropTypes.node.isRequired,
    StopButton: PropTypes.node.isRequired,
    historyStats: PropTypes.shape({
        saved: PropTypes.number,
        sizeEngaged: PropTypes.number,
        notDownloaded: PropTypes.number,
        sizeRequired: PropTypes.number,
        timeEstim: PropTypes.number,
    }),
    bookmarksStats: PropTypes.shape({
        saved: PropTypes.number,
        sizeEngaged: PropTypes.number,
        notDownloaded: PropTypes.number,
        sizeRequired: PropTypes.number,
        timeEstim: PropTypes.number,
    }),
}

export default Import
