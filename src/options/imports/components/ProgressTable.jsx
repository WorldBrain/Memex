import React from 'react'
import PropTypes from 'prop-types'

import { IMPORT_TYPE as TYPE, IMPORT_SERVICES as SERVICES } from '../constants'

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
                <th>
                    Failed (
                    <a target="_blank" href="https://worldbrain.io/import_bug">
                        ?
                    </a>
                    )
                </th>
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
            {allowTypes[TYPE.OTHERS] === SERVICES.POCKET && (
                <ProgressRow label="Pocket" {...progress[TYPE.OTHERS]} />
            )}
            {allowTypes[TYPE.OTHERS] === SERVICES.NETSCAPE && (
                <ProgressRow label="HTML" {...progress[TYPE.OTHERS]} />
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
        [TYPE.OTHERS]: progressShape.isRequired,
    }).isRequired,
    allowTypes: PropTypes.object.isRequired,
}

export default ProgressTable
