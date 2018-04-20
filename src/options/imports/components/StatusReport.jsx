import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Import.css'

const StatusReport = ({
    successCount,
    failCount,
    changeShowDetails,
    children,
}) => (
    <div>
        <h1 className={localStyles.heading}>Import Summary</h1>
        <div className={localStyles.reportDetails}>
            <p>{`Succeeded (${successCount})`}</p>
            <p>{`Failed (${failCount})`}</p>
            <p>{`Total (${successCount + failCount})`}</p>
            {children && (
                <p>
                    <a
                        className={localStyles.showDetails}
                        onClick={changeShowDetails}
                    >
                        {children}
                    </a>
                </p>
            )}
        </div>
    </div>
)

StatusReport.propTypes = {
    successCount: PropTypes.number.isRequired,
    failCount: PropTypes.number.isRequired,
    changeShowDetails: PropTypes.func.isRequired,
    children: PropTypes.string,
}

export default StatusReport
