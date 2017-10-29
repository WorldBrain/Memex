import React from 'react'
import PropTypes from 'prop-types'

import { IMPORT_TYPE as TYPE } from '../constants'
import localStyles from './Import.css'

const ProgressBar = ({ progress, allowTypes }) => {
    // TODO: Move to selector
    let total = allowTypes.h ? progress[TYPE.HISTORY].total : 0
    total += allowTypes.b ? progress[TYPE.BOOKMARK].total : 0
    total += allowTypes.o ? progress[TYPE.OLD].total : 0
    let complete = allowTypes.h ? progress[TYPE.HISTORY].complete : 0
    complete += allowTypes.b ? progress[TYPE.BOOKMARK].complete : 0
    complete += allowTypes.o ? progress[TYPE.OLD].complete : 0

    return (
        <div>
            <div className={localStyles.layer1}>
                <div className={localStyles.layer2}>
                    <progress
                        className={localStyles.process}
                        max={total}
                        value={complete}
                    />
                </div>
            </div>
            <div
                style={{ marginLeft: complete / total * 100 + '%' }}
                className={localStyles.arrowUp}
            />
            <h3
                className={localStyles.progressBar}
                style={{ marginLeft: complete / total * 100 + '%' }}
            >
                {Math.round(parseInt(complete / total * 100).toFixed(2)) + '%'}
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
        [TYPE.OLD]: progressShape.isRequired,
    }).isRequired,
    allowTypes: PropTypes.object.isRequired,
}

export default ProgressBar
