import get from 'lodash/fp/get'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Button, Popup } from 'semantic-ui-react'
import classNames from 'classnames'

import { hrefForLocalPage } from 'src/page-viewer'
import niceTime from 'src/util/nice-time'

import ImgFromPouch from './ImgFromPouch'
import styles from './VisitAsListItem.css'
import { deleteVisit } from '../actions'


const VisitAsListItem = ({doc, compact, onTrashButtonClick}) => {
    const href = hrefForLocalPage({page: doc.page})

    const pageSize = get(['_attachments', 'frozen-page.html', 'length'])(doc.page)
    const sizeInMB = pageSize !== undefined
        ? Math.round(pageSize / 1024**2 * 10) / 10
        : 0

    const visitClasses = classNames({
        [styles.root]: true,
        [styles.compact]: compact,
        [styles.available]: !!href,
    })

    const hasFavIcon = !!(doc.page._attachments && doc.page._attachments.favIcon)
    const favIcon = hasFavIcon
        ? (
            <ImgFromPouch
                className={styles.favIcon}
                doc={doc.page}
                attachmentId='favIcon'
            />
        )
        : <img className={styles.favIcon} src='img/null-icon.png' />

    const deleteButton = (
        <Popup
            trigger={
                <Button
                    icon='trash'
                    onClick={e => { e.preventDefault() }}
                    floated='right'
                    tabIndex='-1'
                />
            }
            content={
                <Button
                    negative
                    content={`Forget this item`}
                    onClick={e => { onTrashButtonClick() }}
                    title={`Stored page size: ${sizeInMB} MB`}
                />
            }
            on='focus'
            hoverable
            position='right center'
        />
    )

    return (
        <a
            href={href}
            title={href ? undefined : `Page not available. Perhaps storing failed?`}
            className={visitClasses}
            // DEBUG Show document props on ctrl+meta+click
            onClick={e => { if (e.metaKey && e.ctrlKey) { console.log(doc); e.preventDefault() } }}
            onKeyPress={e => { if (e.key==='Delete') { onTrashButtonClick() } }}
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
                    : favIcon
                }
            </div>
            <div className={styles.descriptionContainer}>
                <div
                    className={styles.title}
                >
                    {hasFavIcon && favIcon}
                    <span title={doc.page.title}>
                        {doc.page.title}
                    </span>
                </div>
                <div className={styles.url}>
                    <a
                        href={doc.page.url}
                    >
                        {doc.page.url}
                    </a>
                </div>
                <div className={styles.time}>{niceTime(doc.visitStart)}</div>
            </div>
            <div className={styles.buttonsContainer}>
                {deleteButton}
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
