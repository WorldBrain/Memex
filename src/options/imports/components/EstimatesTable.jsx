import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { IMPORT_TYPE as TYPE } from '../constants'

import localStyles from './Import.css'

const EstimatesTable = ({
    onAllowHistoryClick,
    onAllowBookmarksClick,
    estimates,
    allowTypes,
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
                <td>{estimates[TYPE.HISTORY].complete}</td>
                <td>{estimates[TYPE.BOOKMARK].complete}</td>
            </tr>
            <tr
                className={classNames(
                    localStyles.importTableRow,
                    localStyles.importTableRowSepar,
                )}
            >
                <td className={localStyles.importTableCellSepar}>
                    ~ Size on Hard Drive
                </td>
                <td className={localStyles.importTableCellSepar}>
                    {estimates[TYPE.HISTORY].sizeCompleted} MB
                </td>
                <td className={localStyles.importTableCellSepar}>
                    {estimates[TYPE.BOOKMARK].sizeCompleted} MB
                </td>
            </tr>

            <tr className={localStyles.importTableRow}>
                <td>Not yet downloaded</td>
                <td>{estimates[TYPE.HISTORY].remaining}</td>
                <td>{estimates[TYPE.BOOKMARK].remaining}</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>~ Size on Hard Drive</td>
                <td>{estimates[TYPE.HISTORY].sizeRemaining} MB</td>
                <td>{estimates[TYPE.BOOKMARK].sizeRemaining} MB</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>~ Time to download</td>
                <td>{estimates[TYPE.HISTORY].timeRemaining}</td>
                <td>{estimates[TYPE.BOOKMARK].timeRemaining}</td>
            </tr>
            <tr
                className={classNames(
                    localStyles.importTableRow,
                    localStyles.actionTableRow,
                )}
            >
                <td>Import?</td>
                <td>
                    <input
                        type="checkbox"
                        name="history"
                        onChange={onAllowHistoryClick}
                        checked={allowTypes[TYPE.HISTORY]}
                    />
                </td>
                <td>
                    <input
                        type="checkbox"
                        name="bookmarks"
                        onChange={onAllowBookmarksClick}
                        checked={allowTypes[TYPE.BOOKMARK]}
                    />
                </td>
            </tr>
        </tbody>
    </table>
)

const estimatesShape = PropTypes.shape({
    complete: PropTypes.number.isRequired,
    remaining: PropTypes.number.isRequired,
    sizeCompleted: PropTypes.string.isRequired,
    sizeRemaining: PropTypes.string.isRequired,
    timeRemaining: PropTypes.string.isRequired,
})

EstimatesTable.propTypes = {
    // State
    allowTypes: PropTypes.shape({
        [TYPE.HISTORY]: PropTypes.bool.isRequired,
        [TYPE.BOOKMARK]: PropTypes.bool.isRequired,
    }).isRequired,

    // Event handlers
    onAllowHistoryClick: PropTypes.func.isRequired,
    onAllowBookmarksClick: PropTypes.func.isRequired,

    // Data
    estimates: PropTypes.shape({
        [TYPE.HISTORY]: estimatesShape.isRequired,
        [TYPE.BOOKMARK]: estimatesShape.isRequired,
    }).isRequired,
}

export default EstimatesTable
