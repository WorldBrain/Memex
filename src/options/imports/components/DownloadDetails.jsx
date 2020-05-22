import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './DownloadDetails.css'
import styles from '../../options.css'

const filterClass = classNames(localStyles.filterOption, styles.buttonNaked)

const DownloadDetails = ({ children, filterHandlers, filter }) => (
    <div className={localStyles.detailsContainer}>
        <div className={localStyles.filters}>
            <button className={filterClass} onClick={filterHandlers.all}>
                All
            </button>
            <button className={filterClass} onClick={filterHandlers.succ}>
                Success
            </button>
            <button className={filterClass} onClick={filterHandlers.fail}>
                Failed (
                <a
                    target="_blank"
                    href="https://www.notion.so/worldbrain/Imports-fail-and-freeze-3b8a2a55b7da48288ff1e29f6d43b8db"
                >
                    ?
                </a>
                )
            </button>
        </div>
        <table className={localStyles.detailsTable}>
            <thead className={localStyles.detailsTableHead}>
                <tr>
                    <th className={localStyles.urlCol}>URL</th>
                    {filter !== 'success' && (
                        <th className={localStyles.errorsCol}>Errors</th>
                    )}
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
    filter: PropTypes.string.isRequired,

    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default DownloadDetails
