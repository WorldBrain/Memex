import React from 'react'
import PropTypes from 'prop-types'

import { IMPORT_TYPE as TYPE } from '../constants'

import localStyles from './Import.css'

const ProgressTable = ({ progress, showOldExt, allowTypes }) => (
    <table className={localStyles.importTable}>
        <colgroup>
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            {showOldExt && <col className={localStyles.importTableCol} />}
        </colgroup>
        <thead className={localStyles.importTableHead}>
            <tr>
                <th />
                <th>Total Progress</th>
                <th>Successful</th>
                <th>Failed</th>
            </tr>
        </thead>
        <tbody>
            {allowTypes.h && (
                <tr className={localStyles.importTableRow}>
                    <td>Browsing History</td>
                    <td>
                        {progress[TYPE.HISTORY].complete}/{progress[TYPE.HISTORY].total}
                    </td>
                    <td>{progress[TYPE.HISTORY].success}</td>
                    <td>{progress[TYPE.HISTORY].fail}</td>
                </tr>
            )}
            {allowTypes.b && (
                <tr className={localStyles.importTableRow}>
                    <td>Bookmarks</td>
                    <td>
                        {progress[TYPE.BOOKMARK].complete}/{progress[TYPE.BOOKMARK].total}
                    </td>
                    <td>{progress[TYPE.BOOKMARK].success}</td>
                    <td>{progress[TYPE.BOOKMARK].fail}</td>
                </tr>
            )}
            {showOldExt && (
                <tr className={localStyles.importTableRow}>
                    <td>Old Extension Data</td>
                    <td>
                        {progress[TYPE.OLD].complete}/{progress[TYPE.OLD].total}
                    </td>
                    <td>{progress[TYPE.OLD].success}</td>
                    <td>{progress[TYPE.OLD].fail}</td>
                </tr>
            )}
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
    allowTypes: PropTypes.object.isRequired,
}

export default ProgressTable
