import React from 'react'
import PropTypes from 'prop-types'

import {
    TypographyHeadingSmall,
} from 'src/common-ui/components/design-library/typography'

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
                    href="https://worldbrain.io/import_bug"
                >
                    ?
                </a>
                )
            </p>
            <p>{`Total (${successCount + failCount})`}</p>
            {children && (
                <TypographyHeadingSmall className={localStyles.showDetails}>
                    <a
                        onClick={changeShowDetails}
                    >
                        {children}
                    </a>
                </TypographyHeadingSmall>
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
