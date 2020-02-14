import React from 'react'
import PropTypes from 'prop-types'
import { LoadingIndicator, Checkbox } from 'src/common-ui/components'
import { IMPORT_TYPE as TYPE, IMPORT_SERVICES as SERVICES } from '../constants'
import classNames from 'classnames'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'
import localStyles from './Import.css'

const EstimatesTable = ({
    onAllowHistoryClick,
    onAllowBookmarksClick,
    onAllowPocketClick,
    onAllowHTMLClick,
    onInputImport,
    estimates,
    allowTypes,
    isLoading,
    blobUrl,
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
                <th>
                    Saved <br />
                    pages
                </th>
                <th>
                    Not
                    <br /> downloaded
                </th>
                <th>
                    Download <br />
                    time
                </th>
            </tr>
        </thead>
        <tbody>
            <tr className={localStyles.importTableRow}>
                <td>
                    <Checkbox
                        id="history"
                        name="history"
                        isChecked={allowTypes[TYPE.HISTORY]}
                        handleChange={onAllowHistoryClick}
                    >
                        <div className={localStyles.labelContainer}>
                            <span className={localStyles.checkboxText}>
                                Browser History
                            </span>
                            <span className={localStyles.checkboxSubText}>
                                from last 90 days
                            </span>
                        </div>
                    </Checkbox>
                </td>
                <td>{estimates[TYPE.HISTORY].complete}</td>
                <td>{estimates[TYPE.HISTORY].remaining}</td>
                <td>
                    {'~'}
                    {estimates[TYPE.HISTORY].timeRemaining}
                </td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>
                    <Checkbox
                        name="bookmarks"
                        id="bookmarks"
                        handleChange={onAllowBookmarksClick}
                        isChecked={allowTypes[TYPE.BOOKMARK]}
                    >
                        {' '}
                        <div className={localStyles.labelContainer}>
                            <span className={localStyles.checkboxText}>
                                Browser Bookmarks
                            </span>
                            <span className={localStyles.checkboxSubText}>
                                from forever
                            </span>
                        </div>
                    </Checkbox>
                </td>
                <td>{estimates[TYPE.BOOKMARK].complete}</td>
                <td>{estimates[TYPE.BOOKMARK].remaining}</td>
                <td>
                    {'~'}
                    {estimates[TYPE.BOOKMARK].timeRemaining}
                </td>
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>
                    <Checkbox
                        type="checkbox"
                        name="pocket"
                        id="pocket"
                        handleChange={onAllowPocketClick}
                        isChecked={allowTypes[TYPE.OTHERS] === SERVICES.POCKET}
                    >
                        <div className={localStyles.labelContainer}>
                            <span className={localStyles.checkboxText}>
                                Pocket import
                            </span>
                            <span className={localStyles.checkboxSubText}>
                                Bookmarks, tags, time, reading list, archive
                            </span>
                        </div>
                    </Checkbox>
                </td>
                {!isLoading && blobUrl === null && (
                    <td colSpan="3">
                        <div className={localStyles.uploaderBox}>
                            <label
                                className={classNames(localStyles.selectFile, {
                                    [localStyles.hidden]:
                                        allowTypes[TYPE.OTHERS] !==
                                        SERVICES.POCKET,
                                })}
                                htmlFor="file-upload"
                            >
                                Select export file
                            </label>
                            <input
                                type="file"
                                name="file-upload"
                                id="file-upload"
                                onChange={onInputImport}
                                disabled={
                                    allowTypes[TYPE.OTHERS] !== SERVICES.POCKET
                                }
                            />{' '}
                            <ButtonTooltip
                                tooltipText="How can I get that file?"
                                position="right"
                            >
                                <a
                                    href="https://getpocket.com/export"
                                    taget="_blank"
                                >
                                    <span
                                        className={classNames(
                                            localStyles.tutorial,
                                            {
                                                [localStyles.hidden]:
                                                    allowTypes[TYPE.OTHERS] !==
                                                    SERVICES.POCKET,
                                            },
                                        )}
                                    />
                                </a>
                            </ButtonTooltip>
                        </div>
                    </td>
                )}
                {isLoading && allowTypes[TYPE.OTHERS] === SERVICES.POCKET && (
                    <td colSpan="3">
                        <LoadingIndicator />
                    </td>
                )}
                {allowTypes[TYPE.OTHERS] === SERVICES.POCKET &&
                    estimates[TYPE.OTHERS].remaining > 0 &&
                    blobUrl !== null && (
                        <React.Fragment>
                            <td>{estimates[TYPE.OTHERS].complete}</td>
                            <td>{estimates[TYPE.OTHERS].remaining}</td>
                            <td>
                                {'~'}
                                {estimates[TYPE.OTHERS].timeRemaining}
                            </td>
                        </React.Fragment>
                    )}
            </tr>
            <tr className={localStyles.importTableRow}>
                <td>
                    <Checkbox
                        name="html"
                        id="html"
                        isChecked={
                            allowTypes[TYPE.OTHERS] === SERVICES.NETSCAPE
                        }
                        handleChange={onAllowHTMLClick}
                    >
                        <div className={localStyles.labelContainer}>
                            <span className={localStyles.checkboxText}>
                                HTML File
                            </span>
                            <span className={localStyles.checkboxSubText}>
                                Bookmarks, tags, time
                            </span>
                        </div>
                    </Checkbox>
                </td>
                {!isLoading && blobUrl === null && (
                    <td colSpan="3">
                        <div className={localStyles.uploaderBox}>
                            <label
                                className={classNames(localStyles.selectFile, {
                                    [localStyles.hidden]:
                                        allowTypes[TYPE.OTHERS] !==
                                        SERVICES.NETSCAPE,
                                })}
                                htmlFor="netscape-file-upload"
                            >
                                Select export file
                            </label>
                            <input
                                type="file"
                                name="netscape-file-upload"
                                id="netscape-file-upload"
                                onChange={onInputImport}
                                disabled={
                                    allowTypes[TYPE.OTHERS] !==
                                    SERVICES.NETSCAPE
                                }
                            />{' '}
                            <ButtonTooltip
                                tooltipText="How can I get that file?"
                                position="right"
                            >
                                <a
                                    href="https://www.notion.so/worldbrain/7a12d7a019094785a14ff109e99a531d"
                                    taget="_blank"
                                >
                                    <span
                                        className={classNames(
                                            localStyles.tutorial,
                                            {
                                                [localStyles.hidden]:
                                                    allowTypes[TYPE.OTHERS] !==
                                                    SERVICES.NETSCAPE,
                                            },
                                        )}
                                    />
                                </a>
                            </ButtonTooltip>
                        </div>
                    </td>
                )}
                {isLoading && allowTypes[TYPE.OTHERS] === SERVICES.NETSCAPE && (
                    <td colSpan="3">
                        <LoadingIndicator />
                    </td>
                )}
                {allowTypes[TYPE.OTHERS] === SERVICES.NETSCAPE &&
                    estimates[TYPE.OTHERS].remaining > 0 &&
                    blobUrl !== null && (
                        <React.Fragment>
                            <td>{estimates[TYPE.OTHERS].complete}</td>
                            <td>{estimates[TYPE.OTHERS].remaining}</td>
                            <td>
                                {'~'}
                                {estimates[TYPE.OTHERS].timeRemaining}
                            </td>
                        </React.Fragment>
                    )}
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
        [TYPE.OTHERS]: PropTypes.string.isRequired,
    }).isRequired,
    isLoading: PropTypes.bool.isRequired,
    blobUrl: PropTypes.string,
    // Event handlers
    onAllowHistoryClick: PropTypes.func.isRequired,
    onAllowBookmarksClick: PropTypes.func.isRequired,
    onAllowPocketClick: PropTypes.func.isRequired,
    onAllowHTMLClick: PropTypes.func.isRequired,
    onInputImport: PropTypes.func.isRequired,

    // Data
    estimates: PropTypes.shape({
        [TYPE.HISTORY]: estimatesShape.isRequired,
        [TYPE.BOOKMARK]: estimatesShape.isRequired,
        [TYPE.OTHERS]: estimatesShape.isRequired,
    }).isRequired,
}

export default EstimatesTable
