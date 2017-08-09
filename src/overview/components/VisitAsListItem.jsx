import get from 'lodash/fp/get'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { localVersionAvailable, LinkToLocalVersion } from 'src/local-page'
import niceTime from 'src/util/nice-time'

import ImgFromPouch from './ImgFromPouch'
import styles from './VisitAsListItem.css'
import { showDeleteConfirm } from '../actions'


const VisitAsListItem = ({doc, compact, onTrashButtonClick}) => {
    const pageSize = get(['_attachments', 'frozen-page.html', 'length'])(doc.page)
    const sizeInMB = pageSize !== undefined
        ? Math.round(pageSize / 1024**2 * 10) / 10
        : 0
    const visitClasses = classNames({
        [styles.root]: true,
        [styles.compact]: compact,
    })
    const hasFavIcon = !!(doc.page._attachments && doc.page._attachments.favIcon)
    const favIcon = hasFavIcon
        && (
            <ImgFromPouch
                className={styles.favIcon}
                doc={doc.page}
                attachmentId='favIcon'
            />
        )

    const renderTitle = () => {
        const fallback = doc.url
        const { page } = doc

        if (!page.title) {
            return (page.content && page.content.title) ? page.content.title : fallback
        }
        return page.title
    }

    return (
        <a className={visitClasses} href={doc.page.url}>
            <div className={styles.screenshotContainer}>
                {doc.page._attachments && doc.page._attachments.screenshot
                    ? (
                        <ImgFromPouch
                            className={styles.screenshot}
                            doc={doc.page}
                            attachmentId='screenshot'
                        />
                    )
                    : <img className={styles.screenshot} src='/img/null-icon.png' />
                }
            </div>
            <div className={styles.descriptionContainer}>
                <div className={styles.title} title={doc.page.title}>
                    {hasFavIcon && favIcon}
                    {renderTitle()}
                </div>
                <div className={styles.url}>
                    {doc.page.url}
                </div>
                <div className={styles.time}>{niceTime(doc.visitStart)}</div>
            </div>
            <div className={styles.buttonsContainer}>
                <button
                    className={`${styles.button} ${styles.trash}`}
                    onClick={e => { e.preventDefault(); onTrashButtonClick() }}
                    title={`Forget this item (${sizeInMB} MB)`}
                />
                {localVersionAvailable({page: doc.page})
                    ? (
                        <LinkToLocalVersion
                            className={`${styles.button} ${styles.load}`}
                            page={doc.page}
                        />
                    )
                    : null
                }
            </div>
        </a>
    )
}

VisitAsListItem.propTypes = {
    doc: PropTypes.object.isRequired,
    compact: PropTypes.bool,
    onTrashButtonClick: PropTypes.func,
}


const mapStateToProps = state => ({})

const mapDispatchToProps = (dispatch, {doc}) => ({
    onTrashButtonClick: () => dispatch(showDeleteConfirm(doc._id)),
})

export default connect(mapStateToProps, mapDispatchToProps)(VisitAsListItem)
