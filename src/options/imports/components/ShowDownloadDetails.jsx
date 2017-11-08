import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './DownloadDetails.css'

const ShowDownloadDetails = ({ changeShowDetails, showDownloadDetails }) => (
    <div className={localStyles.detailsContainer}>
        <a className={localStyles.showDetails} onClick={changeShowDetails}>
            {showDownloadDetails ? 'Hide Details' : 'Show Details'}
        </a>
    </div>
)

ShowDownloadDetails.propTypes = {
    changeShowDetails: PropTypes.func.isRequired,
    showDownloadDetails: PropTypes.bool.isRequired,
}

export default ShowDownloadDetails
