import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { localVersionAvailable, LinkToLocalVersion } from 'src/page-viewer'
import niceTime from 'src/util/nice-time'

import ImgFromPouch from './ImgFromPouch'
import styles from './VisitAsListItem.css'
import { deleteVisit } from '../actions'


const VisitAsListItem = ({doc, compact, onTrashButtonClick}) => {
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

    return (
        <a
            className={visitClasses}
            href={doc.page.url}
            // DEBUG Show document props on ctrl+meta+click
            onClick={e => { if (e.metaKey && e.ctrlKey) { console.log(doc); e.preventDefault() } }}
        >
            <div className={styles.screenshotContainer}>
                {doc.page._attachments && doc.page._attachments.screenshot
                    ? (
                        <ImgFromPouch
                            className={styles.screenshot}
                            doc={doc.page}
                            attachmentId='screenshot'
                        />
                    )
                    : <img className={styles.screenshot} src='img/null-icon.png' />
                }
            </div>
            <div className={styles.descriptionContainer}>
                <div
                    className={styles.title}
                    title={doc.page.title}
                >
                    {hasFavIcon && favIcon}
                    {doc.page.title}
                </div>
                <div className={styles.url}>
                    {doc.page.url}
                </div>
                <div className={styles.time}>{niceTime(doc.visitStart)}</div>
            </div>
            <div className={styles.buttonsContainer}>
                <button
                    className={styles.button}
                    onClick={e => { e.preventDefault(); onTrashButtonClick() }}
                    title='Forget this item'
                >
                    <img src='img/trash-icon.png' alt='🗑 forget' />
                </button>
                {localVersionAvailable({page: doc.page})
                    ? (
                        <LinkToLocalVersion
                            className={styles.button}
                            page={doc.page}
                        >
                            <img src='img/save-icon.png' alt='💾 saved' />
                        </LinkToLocalVersion>
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
    onTrashButtonClick: () => dispatch(deleteVisit({visitId: doc._id})),
})

export default connect(mapStateToProps, mapDispatchToProps)(VisitAsListItem)
