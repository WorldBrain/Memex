import React from 'react'
import PropTypes from 'prop-types'

import { IMPORT_TYPE as TYPE } from '../constants'

import localStyles from './Import.css'

const ProgressTable = ({ progress, showOldExt }) => (
    <table className={localStyles.importTable}>
        <colgroup>
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            {showOldExt && <col className={localStyles.importTableCol} />}
        </colgroup>
        <thead className={localStyles.importTableHead}>
            <tr>
                <th />
                <th>Browsing History</th>
                <th>Bookmarks</th>
                {showOldExt && <th>Old Extension Data</th>}
            </tr>
        </thead>
        <tbody>
            <tr className={localStyles.importTableRow}>
                <td>Total Progress</td>
                <td>
                    {progress[TYPE.HISTORY].complete}/{progress[TYPE.HISTORY].total}
                </td>
                <td>
                    {progress[TYPE.BOOKMARK].complete}/{progress[TYPE.BOOKMARK].total}
                </td>
                {showOldExt && (
                    <td>
                        {progress[TYPE.OLD].complete}/{progress[TYPE.OLD].total}
                    </td>
                )}
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>Successful</td>
                <td>{progress[TYPE.HISTORY].success}</td>
                <td>{progress[TYPE.BOOKMARK].success}</td>
                {showOldExt && <td>{progress[TYPE.OLD].success}</td>}
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>Failed</td>
                <td>{progress[TYPE.HISTORY].fail}</td>
                <td>{progress[TYPE.BOOKMARK].fail}</td>
                {showOldExt && <td>{progress[TYPE.OLD].fail}</td>}
            </tr>
        </tbody>
    </table>
)

const progressShape = PropTypes.shape({
    total: PropTypes.number.isRequired,
    complete: PropTypes.number.isRequired,
    success: PropTypes.number.isRequired,
    fail: PropTypes.number.isRequired,
})

ProgressTable.propTypes = {
    // State
    showOldExt: PropTypes.bool.isRequired,
    progress: PropTypes.shape({
        [TYPE.HISTORY]: progressShape.isRequired,
        [TYPE.BOOKMARK]: progressShape.isRequired,
    }).isRequired,
}

export default ProgressTable
