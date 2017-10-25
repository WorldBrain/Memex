import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { IMPORT_TYPE as TYPE } from '../constants'

import localStyles from './Import.css'

const EstimatesTable = ({
    onAllowHistoryClick,
    onAllowBookmarksClick,
    onAllowOldExtClick,
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
                <th>Pages already saved</th>
                <th>Not yet downloaded</th>
                <th>Time to download</th>
            </tr>
        </thead>
        <tbody>
            <tr className={localStyles.importTableRow}>
                <td>
                    <input
                        type="checkbox"
                        name="history"
                        id="history"
                        onChange={onAllowHistoryClick}
                        checked={allowTypes[TYPE.HISTORY]}
                    />
                    <label className={localStyles.label} htmlFor="history">
                        <span className={localStyles.checkboxText}>
                            Browsing history
                        </span>
                        <br />
                        <span className={localStyles.checkboxSubText}>
                            (last 90 days)
                        </span>
                    </label>
                </td>
                <td>{estimates[TYPE.HISTORY].complete}</td>
                <td>{estimates[TYPE.HISTORY].remaining}</td>
                <td>{estimates[TYPE.HISTORY].timeRemaining}</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>
                    <input
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
                    </label>
                </td>
                <td>{estimates[TYPE.BOOKMARK].complete}</td>
                <td>{estimates[TYPE.BOOKMARK].remaining}</td>
                <td>{estimates[TYPE.BOOKMARK].timeRemaining}</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>
                    <input
                        type="checkbox"
                        name="history"
                        id="old-ext"
                        onChange={onAllowOldExtClick}
                        checked={allowTypes[TYPE.OLD]}
                    />
                    <label className={localStyles.label} htmlFor="old-ext">
                        <span className={localStyles.checkboxText}>
                            Old extension pages
                        </span>
                    </label>
                </td>
                <td>{estimates[TYPE.OLD].complete}</td>
                <td>{estimates[TYPE.OLD].remaining}</td>
                <td>{estimates[TYPE.OLD].timeRemaining}</td>
            </tr>
            <tr
                className={cx(localStyles.importTableRow, localStyles.disabled)}
            >
                <td>
                    <input
                        type="checkbox"
                        name="evernote"
                        id="evernote"
                        disabled
                    />
                    <label className={localStyles.label} htmlFor="evernote">
                        <span className={localStyles.checkboxText}>
                            Evernote
                        </span>
                    </label>
                </td>
                <td className={localStyles.disabledComingSoon} colSpan="3">
                    [COMING SOON]
                </td>
            </tr>
            <tr
                className={cx(localStyles.importTableRow, localStyles.disabled)}
            >
                <td>
                    <input
                        type="checkbox"
                        name="evernote"
                        id="pocket"
                        disabled
                    />
                    <label className={localStyles.label} htmlFor="pocket">
                        <span className={localStyles.checkboxText}>Pocket</span>
                    </label>
                </td>
                <td className={localStyles.disabledComingSoon} colSpan="3">
                    [COMING SOON]
                </td>
            </tr>
        </tbody>
    </table>
)

const estimatesShape = PropTypes.shape({
    complete: PropTypes.number.isRequired,
    remaining: PropTypes.number.isRequired,
    sizeCompleted: PropTypes.string.isRequired,
    sizeRemaining: PropTypes.string.isRequired,
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
    onAllowOldExtClick: PropTypes.func.isRequired,

    // Data
    estimates: PropTypes.shape({
        [TYPE.HISTORY]: estimatesShape.isRequired,
        [TYPE.BOOKMARK]: estimatesShape.isRequired,
    }).isRequired,
}

export default EstimatesTable
