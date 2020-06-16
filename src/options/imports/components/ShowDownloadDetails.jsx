import React from 'react'
import PropTypes from 'prop-types'
import {
    TypographyHeadingSmall,
} from 'src/common-ui/components/design-library/typography'

import localStyles from './DownloadDetails.css'

const ShowDownloadDetails = ({ changeShowDetails, showDownloadDetails }) => (
    <div className={localStyles.detailsContainer}>
        <TypographyHeadingSmall className={localStyles.showDetails}>
            <a
                onClick={changeShowDetails}
            >
                {showDownloadDetails
                    ? 'Hide Error Details'
                    : 'Show Error Details'}
            </a>
        </TypographyHeadingSmall>
    </div>
)

ShowDownloadDetails.propTypes = {
    changeShowDetails: PropTypes.func.isRequired,
    showDownloadDetails: PropTypes.bool.isRequired,
}

export default ShowDownloadDetails
