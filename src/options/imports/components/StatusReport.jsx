import React from 'react'
import PropTypes from 'prop-types'

import { IMPORT_TYPE as TYPE } from '../constants'
import localStyles from './Import.css'

const StatusReport = ({
    progress,
    allowTypes,
    showDownloadDetails,
    changeShowDetails,
}) => {
    // TODO: Move to selectors; don't reference keys directly
    let total = allowTypes.h ? progress[TYPE.HISTORY].total : 0
    total += allowTypes.b ? progress[TYPE.BOOKMARK].total : 0
    total += allowTypes.o ? progress[TYPE.OLD].total : 0
    let succeed = allowTypes.h ? progress[TYPE.HISTORY].success : 0
    succeed += allowTypes.b ? progress[TYPE.BOOKMARK].success : 0
    succeed += allowTypes.o ? progress[TYPE.OLD].success : 0
    let fail = allowTypes.h ? progress[TYPE.HISTORY].fail : 0
    fail += allowTypes.b ? progress[TYPE.BOOKMARK].fail : 0
    fail += allowTypes.o ? progress[TYPE.OLD].fail : 0

    return (
        <div>
            <h1 className={localStyles.heading}>Import Summary</h1>
            <div className={localStyles.reportDetails}>
                <p>{'Succeeded (' + succeed + ')'}</p>
                <p>{'Failed (' + fail + ')'}</p>
                <p>{'Total (' + total + ')'}</p>
                <p>
                    <a
                        className={localStyles.showDetails}
                        onClick={changeShowDetails}
                    >
                        {showDownloadDetails ? 'Hide Details' : 'Show Details'}
                    </a>
                </p>
            </div>
        </div>
    )
}

const progressShape = PropTypes.shape({
    total: PropTypes.number.isRequired,
    complete: PropTypes.number.isRequired,
    success: PropTypes.number.isRequired,
    fail: PropTypes.number.isRequired,
})

StatusReport.propTypes = {
    progress: PropTypes.shape({
        [TYPE.HISTORY]: progressShape.isRequired,
        [TYPE.BOOKMARK]: progressShape.isRequired,
        [TYPE.OLD]: progressShape.isRequired,
    }).isRequired,
    allowTypes: PropTypes.object.isRequired,
    showDownloadDetails: PropTypes.bool.isRequired,
    changeShowDetails: PropTypes.func.isRequired,
}

export default StatusReport
