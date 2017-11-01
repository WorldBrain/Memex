import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './DownloadDetails.css'

const DownloadDetails = ({ children }) => (
    <div className={localStyles.detailsContainer}>
        <table className={localStyles.detailsTable}>
            <thead className={localStyles.detailsTableHead}>
                <tr>
                    <th className={localStyles.urlCol}>URL</th>
                    <th className={localStyles.errorsCol}>Errors</th>
                </tr>
            </thead>
            <tbody className={localStyles.detailsTableBody}>{children}</tbody>
        </table>
    </div>
)

DownloadDetails.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default DownloadDetails
