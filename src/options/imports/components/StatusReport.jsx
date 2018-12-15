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
        <div className={localStyles.warningContainerReport}>
            <img src="/img/caution.png" className={localStyles.icon} />{' '}
            <p className={localStyles.stepText}>
                Don't forget to{' '}
                <a href="http://memex.link/2Jw-R3BQh/worldbrain.helprace.com/i49-prevent-your-imports-from-stopping-midway">
                    re-enable your browsing protection
                </a>
                .
            </p>
        </div>
        <h1 className={localStyles.heading}>Import Summary</h1>
        <div className={localStyles.reportDetails}>
            <p>{`Succeeded (${successCount})`}</p>
            <p>
                {`Failed (${failCount})`} (
                <a
                    target="_blank"
                    href="https://worldbrain.helprace.com/i117-why-do-so-many-of-my-imports-fail"
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
