import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './DownloadDetails.css'

const DownloadDetails = ({
    children,
    filterHandlers,
    showDownloadDetails,
    downloadDataFilter,
}) =>
    showDownloadDetails && (
        <div className={localStyles.detailsContainer}>
            <table className={localStyles.detailsTable}>
                <thead className={localStyles.detailsTableHead}>
                    <tr>
                        <th className={localStyles.urlCol}>URL</th>
                        <th className={localStyles.errorsCol}>Errors</th>
                    </tr>
                </thead>
                <tbody className={localStyles.detailsTableBody}>
                    {children}
                </tbody>
            </table>
        </div>
    )

DownloadDetails.propTypes = {
    // Event handlers
    filterHandlers: PropTypes.shape({
        all: PropTypes.func.isRequired,
        succ: PropTypes.func.isRequired,
        fail: PropTypes.func.isRequired,
    }).isRequired,
    showDownloadDetails: PropTypes.bool.isRequired,
    downloadDataFilter: PropTypes.string.isRequired,

    // Misc
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default DownloadDetails
