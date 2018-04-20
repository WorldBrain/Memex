import React from 'react'
import PropTypes from 'prop-types'

import { IMPORT_TYPE as TYPE } from '../constants'

import localStyles from './Import.css'

const ProgressRow = ({ label, total, complete, success, fail }) => (
    <tr className={localStyles.importTableRow}>
        <td>{label}</td>
        <td>
            {complete}/{total}
        </td>
        <td>{success}</td>
        <td>{fail}</td>
    </tr>
)

ProgressRow.propTypes = {
    label: PropTypes.string.isRequired,
    total: PropTypes.number.isRequired,
    complete: PropTypes.number.isRequired,
    success: PropTypes.number.isRequired,
    fail: PropTypes.number.isRequired,
}

const ProgressTable = ({ progress, allowTypes }) => (
    <table className={localStyles.importTable}>
        <colgroup>
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
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
            {allowTypes[TYPE.HISTORY] && (
                <ProgressRow
                    label="Browsing History"
                    {...progress[TYPE.HISTORY]}
                />
            )}
            {allowTypes[TYPE.BOOKMARK] && (
                <ProgressRow label="Bookmarks" {...progress[TYPE.BOOKMARK]} />
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
    progress: PropTypes.shape({
        [TYPE.HISTORY]: progressShape.isRequired,
        [TYPE.BOOKMARK]: progressShape.isRequired,
    }).isRequired,
    allowTypes: PropTypes.object.isRequired,
}

export default ProgressTable
