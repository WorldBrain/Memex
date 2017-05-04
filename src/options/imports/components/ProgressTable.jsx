import React, { PropTypes } from 'react'

import localStyles from './Import.css'

const ProgressTable = ({ history, bookmarks }) => (
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
                <td>Total Progress</td>
                <td>{history.progress}/{history.total}</td>
                <td>{bookmarks.progress}/{bookmarks.total}</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>Successful</td>
                <td>{history.successful}</td>
                <td>{bookmarks.successful}</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>Failed</td>
                <td>{history.failed}</td>
                <td>{bookmarks.failed}</td>
            </tr>
        </tbody>
    </table>
)

const propShape = PropTypes.shape({
    progress: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    successful: PropTypes.number.isRequired,
    failed: PropTypes.number.isRequired,
})

ProgressTable.propTypes = {
    // State
    bookmarks: propShape.isRequired,
    history: propShape.isRequired,
}

export default ProgressTable
