import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from '../../options.css'
import localStyles from './DownloadDetails.css'

const filterClass = classNames(localStyles.filterOption, styles.buttonNaked)

const DownloadDetails = ({ children, filterHandlers }) => (
    <div className={localStyles.detailsContainer}>
        <div className={localStyles.headerContainer}>
            <h3 className={localStyles.header}>Download Details</h3>
            <div className={localStyles.filters}>
                <button className={filterClass} onClick={filterHandlers.all}>
                    All
                </button>
                <button className={filterClass} onClick={filterHandlers.succ}>
                    Success
                </button>
                <button className={filterClass} onClick={filterHandlers.fail}>
                    Failed
                </button>
            </div>
        </div>
        <table className={localStyles.detailsTable}>
            <thead className={localStyles.detailsTableHead}>
                <tr>
                    <th className={localStyles.urlCol}>URL</th>
                    <th className={localStyles.downloadedCol}>Downloaded</th>
                    <th className={localStyles.errorsCol}>Errors</th>
                </tr>
            </thead>
            <tbody className={localStyles.detailsTableBody}>{children}</tbody>
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

    // Misc
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default DownloadDetails
