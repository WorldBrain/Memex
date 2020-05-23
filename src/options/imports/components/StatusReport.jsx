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
            <p>
                {`Failed (${failCount})`} (
                <a
                    target="_blank"
                    href="https://www.notion.so/worldbrain/Imports-fail-and-freeze-3b8a2a55b7da48288ff1e29f6d43b8db"
                >
                    ?
                </a>
                )
            </p>
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
