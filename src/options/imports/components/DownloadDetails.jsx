import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from '../../options.css'
import localStyles from './DownloadDetails.css'

const filterClass = classNames(localStyles.filterOption, styles.buttonNaked)

const DownloadDetails = ({
    children,
    filterHandlers,
    showDownloadDetails,
    downloadDataFilter,
}) =>
    showDownloadDetails && (
        <div className={localStyles.detailsContainer}>
            <div className={localStyles.headerContainer}>
                <div className={localStyles.filters}>
                    <button
                        className={filterClass}
                        onClick={filterHandlers.succ}
                    >
                        Success
                    </button>
                    <button
                        className={filterClass}
                        onClick={filterHandlers.fail}
                    >
                        Failed
                    </button>
                </div>
            </div>
            <table className={localStyles.detailsTable}>
                <thead className={localStyles.detailsTableHead}>
                    <tr>
                        <th className={localStyles.urlCol}>URL</th>
                        {downloadDataFilter === 'fail' && (
                            <th className={localStyles.errorsCol}>Errors</th>
                        )}
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
