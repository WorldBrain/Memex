import React from 'react'
import PropTypes from 'prop-types'

import { IMPORT_TYPE as TYPE } from '../constants'

import localStyles from './Import.css'

const EstimatesTable = ({
    onAllowHistoryClick,
    onAllowBookmarksClick,
    estimates,
    allowTypes,
}) => (
    <table className={localStyles.importTable}>
        <colgroup>
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
            <col className={localStyles.importTableCol} />
        </colgroup>
        <thead className={localStyles.importTableHead}>
            <tr>
                <th />
                <th>Saved pages</th>
                <th>Not downloaded</th>
                <th>Download time</th>
            </tr>
        </thead>
        <tbody>
            <tr className={localStyles.importTableRow}>
                <td>
                    <input
                        className={localStyles.checkbox}
                        type="checkbox"
                        name="history"
                        id="history"
                        onChange={onAllowHistoryClick}
                        checked={allowTypes[TYPE.HISTORY]}
                    />
                    <label className={localStyles.label} htmlFor="history">
                        <span className={localStyles.checkboxText}>
                            Browsing History
                        </span>
                        <br />
                        <span className={localStyles.checkboxSubText}>
                            (from last 90 days)
                        </span>
                    </label>
                </td>
                <td>{estimates[TYPE.HISTORY].complete}</td>
                <td>{estimates[TYPE.HISTORY].remaining}</td>
                <td>{'~'}{estimates[TYPE.HISTORY].timeRemaining}</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>
                    <input
                        className={localStyles.checkbox}
                        type="checkbox"
                        name="bookmarks"
                        id="bookmarks"
                        onChange={onAllowBookmarksClick}
                        checked={allowTypes[TYPE.BOOKMARK]}
                    />{' '}
                    <label className={localStyles.label} htmlFor="bookmarks">
                        <span className={localStyles.checkboxText}>
                            Bookmarks
                        </span>
                        <br />
                        <span className={localStyles.checkboxSubText}>
                            (from forever)
                        </span>
                    </label>
                </td>
                <td>{estimates[TYPE.BOOKMARK].complete}</td>
                <td>{estimates[TYPE.BOOKMARK].remaining}</td>
                <td>{'~'}{estimates[TYPE.BOOKMARK].timeRemaining}</td>
            </tr>
        </tbody>
    </table>
)

const estimatesShape = PropTypes.shape({
    complete: PropTypes.number.isRequired,
    remaining: PropTypes.number.isRequired,
    timeRemaining: PropTypes.string.isRequired,
})

EstimatesTable.propTypes = {
    // State
    allowTypes: PropTypes.shape({
        [TYPE.HISTORY]: PropTypes.bool.isRequired,
        [TYPE.BOOKMARK]: PropTypes.bool.isRequired,
    }).isRequired,

    // Event handlers
    onAllowHistoryClick: PropTypes.func.isRequired,
    onAllowBookmarksClick: PropTypes.func.isRequired,

    // Data
    estimates: PropTypes.shape({
        [TYPE.HISTORY]: estimatesShape.isRequired,
        [TYPE.BOOKMARK]: estimatesShape.isRequired,
    }).isRequired,
}

export default EstimatesTable
