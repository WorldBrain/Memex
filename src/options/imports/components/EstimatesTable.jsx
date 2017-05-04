import React, { PropTypes } from 'react'
import classNames from 'classnames'

import localStyles from './Import.css'

const EstimatesTable = ({
    onAllowImportHistoryClick, onAllowImportBookmarksClick,
    historyStats, bookmarksStats, downloadEsts,
    allowImport, isCheckboxDisabled,
}) => (
    <table className={localStyles.importTable}>
        <colgroup>
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
        </colgroup>
        <thead className={localStyles.importTableHead}>
            <tr className={localStyles.importTableRow}>
                <th />
                <th>Browsing History</th>
                <th>Bookmarks</th>
            </tr>
        </thead>
        <tbody>
            <tr className={localStyles.importTableRow}>
                <td>Pages already saved</td>
                <td>{historyStats.saved}</td>
                <td>{bookmarksStats.saved}</td>
            </tr>
            <tr className={classNames(localStyles.importTableRow, localStyles.importTableRowSepar)}>
                <td className={localStyles.importTableCellSepar}>~ Size on Hard Drive</td>
                <td className={localStyles.importTableCellSepar}>{historyStats.sizeEngaged} MB</td>
                <td className={localStyles.importTableCellSepar}>{bookmarksStats.sizeEngaged} MB</td>
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
)

EstimatesTable.propTypes = {
    // State
    isCheckboxDisabled: PropTypes.bool.isRequired,
    downloadEsts: PropTypes.shape({
        bookmarks: PropTypes.string.isRequired,
        history: PropTypes.string.isRequired,
    }).isRequired,
    allowImport: PropTypes.shape({
        history: PropTypes.bool.isRequired,
        bookmarks: PropTypes.bool.isRequired,
    }).isRequired,

    // Event handlers
    onAllowImportHistoryClick: PropTypes.func.isRequired,
    onAllowImportBookmarksClick: PropTypes.func.isRequired,

    // Data
    historyStats: PropTypes.shape({
        saved: PropTypes.number.isRequired,
        sizeEngaged: PropTypes.number.isRequired,
        notDownloaded: PropTypes.number.isRequired,
        sizeRequired: PropTypes.number.isRequired,
        timeEstim: PropTypes.number.isRequired,
    }).isRequired,
    bookmarksStats: PropTypes.shape({
        saved: PropTypes.number.isRequired,
        sizeEngaged: PropTypes.number.isRequired,
        notDownloaded: PropTypes.number.isRequired,
        sizeRequired: PropTypes.number.isRequired,
        timeEstim: PropTypes.number.isRequired,
    }).isRequired,
}

export default EstimatesTable
