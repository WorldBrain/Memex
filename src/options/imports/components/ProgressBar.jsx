import React from 'react'
import PropTypes from 'prop-types'

import { IMPORT_TYPE as TYPE } from '../constants'
import localStyles from './Import.css'

const ProgressBar = ({ progress, allowTypes }) => {
    let total = allowTypes.h ? progress[TYPE.HISTORY].total : 0
    total += allowTypes.b ? progress[TYPE.BOOKMARK].total : 0
    let complete = allowTypes.h ? progress[TYPE.HISTORY].complete : 0
    complete += allowTypes.b ? progress[TYPE.BOOKMARK].complete : 0
    return (
        <div>
            <progress
                className={localStyles.process}
                max={total}
                value={complete}
            />
            <div
                style={{ marginLeft: complete / total * 100 - 0.7 + '%' }}
                className={localStyles.arrowUp}
            />
            <h3
                className={localStyles.progressBar}
                style={{ marginLeft: complete / total * 100 - 0.7 + '%' }}
            >
                {(complete / total).toFixed(2) * 100 + '%'}
            </h3>
        </div>
    )
}

const progressShape = PropTypes.shape({
    total: PropTypes.number.isRequired,
    complete: PropTypes.number.isRequired,
    success: PropTypes.number.isRequired,
    fail: PropTypes.number.isRequired,
})

ProgressBar.propTypes = {
    progress: PropTypes.shape({
        [TYPE.HISTORY]: progressShape.isRequired,
        [TYPE.BOOKMARK]: progressShape.isRequired,
    }).isRequired,
    allowTypes: PropTypes.object.isRequired,
}

export default ProgressBar
