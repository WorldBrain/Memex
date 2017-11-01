import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import niceTime from 'src/util/nice-time'

import ImgFromPouch from './ImgFromPouch'
import styles from './PageResultItem.css'
import { showDeleteConfirm } from '../actions'
import * as constants from '../constants'

// Format either visit, bookmark, or nothing, depending on doc `displayType`.
const renderTime = ({ doc }) =>
    doc.displayType !== constants.RESULT_TYPES.UNKNOWN
        ? niceTime(doc[doc.displayType])
        : ''

const getMainClasses = ({ compact }) =>
    classNames({
        [styles.root]: true,
        [styles.compact]: compact,
    })

const getBookmarkClass = ({ doc, showOnlyBookmarks }) => {
    const isBookmark =
        showOnlyBookmarks || doc.displayType === constants.RESULT_TYPES.BOOKMARK

    return classNames({
        [styles.button]: true,
        [styles.bookmark]: isBookmark,
        [styles.notBookmark]: !isBookmark,
    })
}

const PageResultItem = ({
    doc,
    sizeInMB,
    onTrashButtonClick,
    compact = false,
    showOnlyBookmarks,
}) => {
    const hasFavIcon = !!(doc._attachments && doc._attachments.favIcon)
    const favIcon = hasFavIcon && (
        <ImgFromPouch
            className={styles.favIcon}
            doc={doc}
            attachmentId="favIcon"
        />
    )

    return (
        <a
            className={getMainClasses({ compact })}
            href={doc.url}
            target="_blank"
        >
            <div className={styles.screenshotContainer}>
                {doc._attachments && doc._attachments.screenshot ? (
                    <ImgFromPouch
                        className={styles.screenshot}
                        doc={doc}
                        attachmentId="screenshot"
                    />
                ) : (
                    <img
                        className={styles.screenshot}
                        src="/img/null-icon.png"
                    />
                )}
            </div>
            <div className={styles.descriptionContainer}>
                <div className={styles.title} title={doc.title}>
                    {hasFavIcon && favIcon}
                    {doc.title}
                </div>
                <div className={styles.url}>{doc.url}</div>
                <div className={styles.time}>{renderTime({ doc })}</div>
            </div>
            <div className={styles.buttonsContainer}>
                <button
                    className={getBookmarkClass({ doc, showOnlyBookmarks })}
                />
                <button
                    className={`${styles.button} ${styles.trash}`}
                    onClick={onTrashButtonClick}
                    title={`Forget this item (${sizeInMB} MB)`}
                />
            </div>
        </a>
    )
}

PageResultItem.propTypes = {
    doc: PropTypes.object.isRequired,
    sizeInMB: PropTypes.string.isRequired,
    compact: PropTypes.bool,
    showOnlyBookmarks: PropTypes.bool,
    onTrashButtonClick: PropTypes.func,
}

const mapStateToProps = state => ({})

const mapDispatchToProps = (dispatch, { doc }) => ({
    onTrashButtonClick: e => {
        e.preventDefault()
        dispatch(showDeleteConfirm(doc.url))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(PageResultItem)
