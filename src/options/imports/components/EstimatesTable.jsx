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
            <col className={localStyles.importTableCol} />
        </colgroup>
        <thead className={localStyles.importTableHead}>
            <tr className={localStyles.importTableRow}>
                <th />
                <th>Pages already saved</th>
                <th>Size on Hard Drive</th>
                <th>Not yet downloaded</th>
                <th>Size on Hard Drive</th>
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
                    <label htmlFor="history">
                        <span className={localStyles.checkboxText}>
                            Browsing history
                        </span>
                        <br />(last 90 days)
                    </label>
                </td>
                <td>{estimates[TYPE.HISTORY].complete}</td>
                <td>{estimates[TYPE.HISTORY].sizeCompleted} MB</td>
                <td>{estimates[TYPE.HISTORY].remaining}</td>
                <td>{estimates[TYPE.HISTORY].sizeRemaining} MB</td>
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
                    <label htmlFor="bookmarks">
                        <span className={localStyles.checkboxText}>
                            Bookmarks
                        </span>
                    </label>
                </td>
                <td>{estimates[TYPE.BOOKMARK].complete}</td>
                <td>{estimates[TYPE.BOOKMARK].sizeCompleted} MB</td>
                <td>{estimates[TYPE.BOOKMARK].remaining}</td>
                <td>{estimates[TYPE.BOOKMARK].sizeRemaining} MB</td>
                <td>{estimates[TYPE.BOOKMARK].timeRemaining}</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>
                    <input
                        type="checkbox"
                        name="evernote"
                        id="evernote"
                        disabled
                    />
                    <label htmlFor="evernote">
                        <span className={localStyles.checkboxText}>
                            Evernote
                        </span>
                    </label>
                </td>
                <td colSpan="5">[COMING SOON]</td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>
                    <input
                        type="checkbox"
                        name="evernote"
                        id="pocket"
                        disabled
                    />
                    <label htmlFor="pocket">
                        <span className={localStyles.checkboxText}>Pocket</span>
                    </label>
                </td>
                <td colSpan="5">[COMING SOON]</td>
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

    // Data
    estimates: PropTypes.shape({
        [TYPE.HISTORY]: estimatesShape.isRequired,
        [TYPE.BOOKMARK]: estimatesShape.isRequired,
    }).isRequired,
}

export default EstimatesTable
