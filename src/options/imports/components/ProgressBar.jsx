import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Import.css'

const ProgressBar = ({ progress }) => (
    <div>
        <div className={localStyles.progressBar}>
            <div
                className={localStyles.progressColor}
                style={{ width: progress + '%' }}
            />
        </div>
        <div
            style={{ marginLeft: progress + '%' }}
            className={localStyles.arrowUp}
        />
        <h3
            className={localStyles.progressBarText}
            style={{ width: progress + '%' }}
        >
            {Math.round(parseInt(progress).toFixed(2)) + '%'}
        </h3>
    </div>
)

ProgressBar.propTypes = {
    progress: PropTypes.number.isRequired,
}

export default ProgressBar
