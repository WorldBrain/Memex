import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { localVersionAvailable, LinkToLocalVersion } from 'src/local-page'
import niceTime from 'src/util/nice-time'

import ImgFromPouch from './ImgFromPouch'
import styles from './PageResultItem.css'
import { showDeleteConfirm } from '../actions'
import * as constants from '../constants'

// Format either visit, bookmark, or nothing, depending on doc `displayType`.
const renderTime = ({ doc }) => {
    switch (doc.displayType) {
        case constants.RESULT_TYPES.BOOKMARK:
            return niceTime(doc.assoc.bookmark.dateAdded)
        case constants.RESULT_TYPES.VISIT:
            return niceTime(doc.assoc.visit.visitStart)
        default:
            return ''
    }
}

const getMainClasses = ({ compact }) => classNames({
    [styles.root]: true,
    [styles.compact]: compact,
})

const PageResultItem = ({ doc, sizeInMB, onTrashButtonClick, compact = false, isBookmark = false }) => {
    const hasFavIcon = !!(doc._attachments && doc._attachments.favIcon)
    const favIcon = hasFavIcon
        && (
            <ImgFromPouch
                className={styles.favIcon}
                doc={doc}
                attachmentId='favIcon'
            />
        )

    return (
        <a className={getMainClasses({ compact })} href={doc.url}>
            {isBookmark && <div className={styles.bookmarkRibbon} />}
            <div className={styles.screenshotContainer}>
                {doc._attachments && doc._attachments.screenshot
                    ? (
                        <ImgFromPouch
                            className={styles.screenshot}
                            doc={doc}
                            attachmentId='screenshot'
                        />
                    )
                    : <img className={styles.screenshot} src='/img/null-icon.png' />
                }
            </div>
            <div className={styles.descriptionContainer}>
                <div className={styles.title} title={doc.title}>
                    {hasFavIcon && favIcon}
                    {doc.title}
                </div>
                <div className={styles.url}>
                    {atob(doc.url)}
                </div>
                <div className={styles.time}>{renderTime({ doc })}</div>
            </div>
            <div className={styles.buttonsContainer}>
                <button
                    className={`${styles.button} ${styles.trash}`}
                    onClick={onTrashButtonClick}
                    title={`Forget this item (${sizeInMB} MB)`}
                />
                {localVersionAvailable({ page: doc })
                    ? (
                        <LinkToLocalVersion
                            className={`${styles.button} ${styles.load}`}
                            page={doc}
                        />
                    )
                    : null
                }
            </div>
        </a>
    )
}

PageResultItem.propTypes = {
    doc: PropTypes.object.isRequired,
    sizeInMB: PropTypes.string.isRequired,
    compact: PropTypes.bool,
    isBookmark: PropTypes.bool,
    onTrashButtonClick: PropTypes.func,
}

const mapStateToProps = state => ({})

const mapDispatchToProps = (dispatch, { doc }) => ({
    onTrashButtonClick: e => {
        e.preventDefault()
        dispatch(showDeleteConfirm(doc.assoc[doc.displayType]))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(PageResultItem)
