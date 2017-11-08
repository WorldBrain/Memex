import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Import.css'

const ProgressBar = ({ progress }) => (
    <div>
        <div className={localStyles.layer1}>
            <div className={localStyles.layer2}>
                <progress
                    className={localStyles.process}
                    max={100}
                    value={progress}
                />
            </div>
        </div>
        <div
            style={{ marginLeft: progress + '%' }}
            className={localStyles.arrowUp}
        />
        <h3
            className={localStyles.progressBar}
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
